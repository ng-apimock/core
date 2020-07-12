import * as fs from 'fs-extra';
import { injectable } from 'inversify';

@injectable()
export class FileLoader {
    loadFile(filePath: string) {
        return fs.readJsonSync(filePath);
    }
}
