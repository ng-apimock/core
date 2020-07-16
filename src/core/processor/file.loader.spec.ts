import 'reflect-metadata';
import { Container } from 'inversify';

import { FileLoader } from './file.loader';

describe('FileLoader', () => {
    let container: Container;
    let fileLoader: FileLoader;

    beforeEach(() => {
        container = new Container();

        container.bind('FileLoader').to(FileLoader);

        fileLoader = container.get<FileLoader>('FileLoader');
    });
    describe('load', () => {
        it('loads the file from the filepath', () => {
            const packageJson = fileLoader.loadFile('package.json');
            expect(packageJson.name).toBe('@ng-apimock/core');
        });
    });
});
