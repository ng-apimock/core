import * as path from 'path';

import { injectable } from 'inversify';

@injectable()
export class FileLoader {
    loadFile(filePath: string) {
        const requireFilePath = path.relative(
            path.resolve(__dirname),
            path.resolve(filePath)
        );
        delete require.cache[require.resolve(requireFilePath)];
        // eslint-disable-next-line import/no-dynamic-require
        return require(requireFilePath);
    }
}
