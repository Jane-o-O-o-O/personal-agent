import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { Artifact } from '../shared/contracts.js';
import type { Store } from './store.js';
import { AppError } from './errors.js';

export class ArtifactService {
  constructor(private store:Store, private dataDir:string) {}
  write(taskId:string,name:string,content:string,mimeType='text/markdown'): Artifact {
    if (typeof name !== 'string' || name !== basename(name) || !name.trim() || name.length > 180 || /[\x00-\x1f]/.test(name)) throw new AppError('INVALID_FILENAME','文件名称不正确');
    if (Buffer.byteLength(content,'utf8') > 2 * 1024 * 1024) throw new AppError('ARTIFACT_TOO_LARGE','成果文件超过 2 MB');
    const id = randomUUID(); const directory = join(this.dataDir,'artifacts',taskId);
    mkdirSync(directory,{recursive:true,mode:0o700});
    const path = join(directory,`${id}-${name}`);
    writeFileSync(path,content,{mode:0o600,flag:'wx'});
    const artifact:Artifact = {id,taskId,name,mimeType,size:Buffer.byteLength(content,'utf8'),createdAt:new Date().toISOString()};
    this.store.transaction(() => { this.store.run('INSERT INTO artifacts(id,task_id,path,json) VALUES (?,?,?,?)',id,taskId,path,JSON.stringify(artifact)); this.store.publish('artifact.created',id,artifact,taskId); });
    return artifact;
  }
  get(id:string): {artifact:Artifact;path:string} {
    const row = this.store.get<{json:string;path:string}>('SELECT json,path FROM artifacts WHERE id=?',id);
    if (!row) throw new AppError('NOT_FOUND','成果不存在',404);
    return {artifact:JSON.parse(row.json),path:row.path};
  }
}
