import path, {normalize} from 'path';
import fs from "fs";
import {fileURLToPath} from 'url';

export class FileUtils {

    static readLocalFileContent(tool){
        if (tool.requestTemplate.type === "file"){
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            return fs.readFileSync(path.join(path.join(__dirname, '..'), tool.requestTemplate.url), 'utf8');
        }
    }
}