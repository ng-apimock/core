import { Container } from 'inversify';
import { createSpyObj } from 'jest-createspyobj';

import { InstanceHolder } from './instance.holder';
import { Mock } from './mock/mock';
import { Preset } from './preset/preset';
import { FileLoader } from './processor/file.loader';
import { State } from './state/state';

describe('InstanceHolder', () => {
    let container: Container;
    let holder: InstanceHolder;
    let fileLoader: jest.Mocked<FileLoader>;
    let state: State;

    beforeEach(() => {
        container = new Container();
        fileLoader = createSpyObj(FileLoader);

        container.bind('Configuration').toConstantValue({ middleware: { basePath: '/base-path' } });
        container.bind('InstanceHolder').to(InstanceHolder);
        container.bind('FileLoader').toConstantValue(fileLoader);
        container.bind('State').to(State).inSingletonScope();

        state = container.get<State>('State');
        holder = container.get<InstanceHolder>('InstanceHolder');
    });

    describe('getInformation', () => {
        beforeEach(() => {
            (state as any)._mocks = [{ name: 'one' } as Mock];
            (state as any)._presets = [
                { name: 'happy' } as Preset,
                { name: 'unhappy' } as Preset
            ];
            (state as any)._processingOptions = {
                src: './src',
                patterns: {
                    mocks: '**/*.mock.json',
                    presets: '**/*.preset.json'
                },
                watch: true
            };
            fileLoader.loadFile.mockReturnValue({
                name: '@ng-apimock/core',
                description: 'ng-apimock core module',
                version: 'x.x.x'
            });
        });

        it('gets the information', () => {
            const information = holder.getInformation();

            expect(information.build).toEqual({
                artifact: '@ng-apimock/core',
                description: 'ng-apimock core module',
                version: 'x.x.x'
            });
            expect(information.configuration).toEqual({
                basePath: '/base-path'
            });
            expect(information.processing).toEqual({
                options: {
                    src: './src',
                    patterns: {
                        mocks: '**/*.mock.json',
                        presets: '**/*.preset.json'
                    },
                    watch: true
                }
            });

            expect(information.processed).toEqual({
                mocks: 1,
                presets: 2
            });

            expect(information.uptime).toBeDefined();
        });
    });

    describe('uptime', () => {
        it('get the uptime', () => {
            expect((holder as any).uptime(90061)).toEqual('1 day, 1 hour, 1 minute, 1 second');
            expect((holder as any).uptime(180122)).toEqual('2 days, 2 hours, 2 minutes, 2 seconds');
            expect((holder as any).uptime(0)).toEqual('');
        });
    });
});
