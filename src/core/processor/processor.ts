import 'reflect-metadata';
import {inject, injectable} from 'inversify';

import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as path from 'path';

import Mock from '../mock/mock';
import MocksState from '../state/mocks.state';
import {HttpHeaders, HttpStatusCode} from '../middleware/http';
import ProcessingOptions from './processing.options';

/** Mocks processor. */
@injectable()
class MocksProcessor {
    private defaultDelay = 0;
    private DEFAULT_ECHO = false;
    private PASS_THROUGH = 'passThrough';

    /**
     * Constructor.
     * @param {MocksState} mocksState The mocks state.
     */
    constructor(@inject('MocksState') public mocksState: MocksState) {
    }

    /**
     * Initialize apimock by:
     * - processing the globs and processing all available mocks.
     * @param {ProcessingOptions} options The processing options.
     */
    process(options: ProcessingOptions): void {
        let counter = 0;
        glob.sync(options.pattern || '**/*.json', {
            cwd: options.src,
            root: '/'
        }).forEach((file) => {
            const mockPath = path.join(options.src, file);
            const mock = fs.readJsonSync(mockPath);
            const match = this.mocksState.mocks.find((_mock: Mock) => _mock.name === mock.name);
            const index = this.mocksState.mocks.indexOf(match);

            mock.path = path.dirname(mockPath);

            if (index > -1) { // exists so update mock
                console.warn(`Mock with identifier '${mock.name}' already exists. Overwriting existing mock.`);
                this.mocksState.mocks[index] = mock;
            } else { // add mock
                this.mocksState.mocks.push(mock);
                counter++;
            }

            Object.keys(mock.responses).forEach((key) => {
                const response = mock.responses[key];
                if (response.status === undefined) {
                    response.status = HttpStatusCode.OK;
                }
                if (response.data === undefined) {
                    response.data = mock.isArray ? [] : {};
                }
                if (response.headers === undefined) {
                    response.headers = response.file !== undefined ?
                        HttpHeaders.CONTENT_TYPE_BINARY :
                        HttpHeaders.CONTENT_TYPE_APPLICATION_JSON;
                }
                return response;
            });

            const _default = Object.keys(mock.responses).find(key => !!mock.responses[key]['default']);
            let state = {
                scenario: this.PASS_THROUGH,
                echo: this.DEFAULT_ECHO,
                delay: mock.delay || this.defaultDelay
            };

            if (_default !== undefined) {
                state = {
                    scenario: _default,
                    echo: this.DEFAULT_ECHO,
                    delay: mock.delay || this.defaultDelay
                };
            }

            this.mocksState.defaults[mock.name] = state;
            this.mocksState.global.mocks[mock.name] = JSON.parse(JSON.stringify(state));
        });

        console.log(`Processed ${counter} unique mocks.`);
    }
}

export default MocksProcessor;
