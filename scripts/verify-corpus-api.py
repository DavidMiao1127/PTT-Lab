"""Verify corpus exchange against an isolated local database on port 5173."""
import http.cookiejar
import json
from pathlib import Path
import sys
import urllib.error
import urllib.request
import uuid

origin = "http://127.0.0.1:5173"
key_path = Path(sys.argv[1])
key = key_path.read_text().strip().split("=", 1)[1]
instance = str(uuid.uuid4())
run = "qa-" + instance
client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))


def call(path, data=None, *, admin=False, status=200, jsonl=False):
    headers = {"Origin": origin, "X-APT-Client-ID": instance}
    if admin:
        headers["Authorization"] = "Bearer " + key
    if data is not None:
        headers["Content-Type"] = "application/x-ndjson" if jsonl else "application/json"
        data = data.encode() if jsonl else json.dumps(data).encode()
    request = urllib.request.Request(origin + path, data=data, headers=headers)
    try:
        response = client.open(request)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        payload = response.read().decode()
        assert response.code == status, (path, response.code, payload[:500])
        return payload if jsonl and data is None else json.loads(payload)


corpus = "/api/admin/corpus"
annotation = "/api/annotation"
call(corpus, status=403)
call(corpus, "{}", status=403, jsonl=True)
sources = [json.loads(line) for line in call(corpus, admin=True, jsonl=True).splitlines()]
assert len({s["item_id"] for s in sources}) == len(sources)
base = [s for s in sources if not s["item_id"].startswith("src-")]
assert len(base) == 480
for source in base:
    left, right = source["context_before"], source["context_after"]
    expected = None if source["level"] == "passage" else left + "⟪ACADEMIC_GAP⟫" + right
    assert source["masked_context"] == expected

authors = [source for source in base if source["author"] == "Bertrand Russell"]
targets = {level: next(s for s in authors if s["level"] == level) for level in ("passage", "paragraph", "sentence")}
common = {"method": run, "model": "qa-model", "run_id": run}
generated = []
expected = {}
for level, source in targets.items():
    candidate = "Synthetic QA candidate for " + level + " " + instance
    expected[source["item_id"]] = (source, candidate)
    item = {"item_id": source["item_id"], **common}
    if level == "paragraph":
        item.update(a=candidate, b=source["real_text"], real="B")
    else:
        item["generated_text"] = candidate
    generated.append(item)

standalone = {
    **common, "domain": "philosophy", "author": "Bertrand Russell", "level": "sentence",
    "context_before": "Synthetic QA context. ", "context_after": "", "a": "Authentic QA " + instance,
    "b": "Generated QA " + instance, "real": "A",
}
generated.append(standalone)


def upload(rows, status=200):
    payload = "\n".join(json.dumps(row, ensure_ascii=False) for row in rows)
    return call(corpus, payload, admin=True, jsonl=True, status=status)


assert "Line 2" in upload([generated[0], {"item_id": "no-such-id", **common, "generated_text": "bad"}], 400)["error"]
assert upload(generated) == {"imported": 4, "existing": 0}
assert upload(generated) == {"imported": 0, "existing": 4}
assert upload([{**generated[0], "generated_text": "conflict"}, {**standalone, "a": "uncommitted QA"}], 409)
again = [json.loads(line) for line in call(corpus, admin=True, jsonl=True).splitlines()]
source = next(s for s in again if s["real_text"] == standalone["a"])
assert not any(s["real_text"] == "uncommitted QA" for s in again)
expected[source["item_id"]] = (source, standalone["b"])
assert upload([{**common, "item_id": source["item_id"], "generated_text": standalone["b"]}])["existing"] == 1

catalog = call(annotation + "?mode=catalog")
available = next(a["total"] for a in catalog["authors"] if a["name"] == "Bertrand Russell")
started = call(annotation, {
    "action": "start", "profile": {"domain": "philosophy", "authors": ["Bertrand Russell"], "role": "general", "consent": True},
    "count": available,
})
try:
    private = call("/api/admin?id=" + started["id"], admin=True)
    for item in (item for item in private["pairMetadata"] if item.get("method") == run):
        source, candidate = expected.pop(item["item_id"])
        visible = call(annotation + "?mode=pair&id=" + item["id"])
        assert visible["level"] == source["level"]
        assert visible["contextBefore"] == source["context_before"]
        assert visible["contextAfter"] == source["context_after"]
        assert {visible["a"], visible["b"]} == {source["real_text"], candidate}
        assert {"method", "model", "real", "run_id"}.isdisjoint(visible)
    assert not expected
finally:
    call(annotation, {"action": "reset"})
print("PASS: private export, stable IDs and masks, both import formats, rollback, deduplication, catalogue, and all three participant displays.")
