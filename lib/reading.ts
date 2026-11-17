import materials from '../data/reading/materials.json';
import documents from '../data/reading/pair-documents.json';
import {pairs} from './pairs';
import {pseudonymize,pseudonymizeProfile} from './author-aliases.server';
const documentByPair = documents as Record<string,string>;
const documentBySource = new Map(pairs.flatMap(pair=>pair.item_id&&documentByPair[pair.id]?[[pair.item_id,documentByPair[pair.id]] as const]:[]));
export const readingVersion='persona-reading-20261106-v1';
export const minimumReadingSeconds=8;
export function readingMaterial(author:string,role:string,pairs:{id:string;item_id?:string}[]){
 const source=materials.find(p=>pseudonymize(p.name)===author);if(!source)throw new Error('学者资料不存在');
 const basic=pseudonymizeProfile({id:source.id,name:source.name,biography:source.biography,persona:source.persona,sources:[]});
 if(role!=='full')return basic;
 const ids=new Set(pairs.map(pair=>documentByPair[pair.id]||(pair.item_id?documentBySource.get(pair.item_id):undefined)));
 const works=source.works.filter(w=>ids.has(w.id));
 return {...basic,
  examples:pseudonymizeProfile(source.examples.map(({sourceId,text,titleZh,titleEn})=>({sourceId,text,titleZh,titleEn}))),
  works:pseudonymizeProfile((works.length?works:source.works).map(({id,titleZh,titleEn,summary})=>({id,titleZh,titleEn,summary})))};
}
