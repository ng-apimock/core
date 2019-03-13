import 'reflect-metadata';
import {Container} from 'inversify';
import * as sinon from 'sinon';
import {MocksProcessor} from './mocks.processor';
import {Processor} from './processor';
import {PresetsProcessor} from './presets.processor';

describe('MocksProcessor', () => {
    let container: Container;
    let mocksProcessor: sinon.SinonStubbedInstance<MocksProcessor>;
    let presetsProcessor: sinon.SinonStubbedInstance<PresetsProcessor>;
    let processor: Processor;

    beforeAll(() => {
        container = new Container();
        mocksProcessor = sinon.createStubInstance(MocksProcessor);
        presetsProcessor = sinon.createStubInstance(PresetsProcessor);

        container.bind('MocksProcessor').toConstantValue(mocksProcessor);
        container.bind('PresetsProcessor').toConstantValue(presetsProcessor);
        container.bind('Processor').to(Processor);

        processor = container.get<Processor>('Processor');
    });

    describe('process', () => {
        beforeAll(() => {
            processor.process({ src: 'src' });
        });

        it('processes the mocks', () =>
            sinon.assert.calledWith(mocksProcessor.process, { src: 'src' }));

        it('processes the presets', () =>
            sinon.assert.calledWith(presetsProcessor.process, { src: 'src' }));
    });
});
