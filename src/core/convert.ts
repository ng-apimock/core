import * as path from 'path';

import * as debug from 'debug';
import * as fs from 'fs-extra';
import * as glob from 'glob';

export const log = debug('ng-apimock:convert');

/** Convertor of mocks. */
export class Converter {
    /**
     * Converts the mocks matching the criteria to the new schema.
     * @param {string} sourceDirectory The source directory.
     * @param {string} destinationDirectory The destination directory.
     * @param {string} pattern The pattern.
     */
    convert(sourceDirectory: string, destinationDirectory: string, pattern = '**/*.mock.json'): void {
        log('>> Converting mocks');
        glob.sync(pattern, { cwd: sourceDirectory }).forEach((file) => {
            const source = path.join(sourceDirectory, file);
            const destination = path.join(process.cwd(), destinationDirectory, file);
            const mock = fs.readJsonSync(source);

            if (!mock.request) {
                mock.request = {};
            }

            if (mock.expression) {
                mock.request.url = mock.expression;
                delete mock.expression;
            }

            if (mock.method) {
                mock.request.method = mock.method;
                delete mock.method;
            }

            fs.outputJsonSync(destination, mock, { spaces: 2 });
            log(`'${source}' -> '${destination}`);
        });
    }
}
