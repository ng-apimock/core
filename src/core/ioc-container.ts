import 'reflect-metadata';

import * as bodyParser from 'body-parser';
import { NextHandleFunction } from 'connect';
import { Container } from 'inversify';

import { Configuration, DefaultConfiguration } from './configuration';
import { InstanceHolder } from './instance.holder';
import { AddMockScenarioToPresetHandler } from './middleware/handlers/api/add-mockscenario-to-preset.handler';
import { CreateMockHandler } from './middleware/handlers/api/create-mock.handler';
import { CreatePresetHandler } from './middleware/handlers/api/create-preset.handler';
import { DefaultsHandler } from './middleware/handlers/api/defaults.handler';
import { DeleteVariableHandler } from './middleware/handlers/api/delete-variable.handler';
import { GetMocksHandler } from './middleware/handlers/api/get-mocks.handler';
import { GetPresetsHandler } from './middleware/handlers/api/get-presets.handler';
import { GetRecordedResponseHandler } from './middleware/handlers/api/get-recorded-response.handler';
import { GetRecordingsHandler } from './middleware/handlers/api/get-recordings.handler';
import { GetVariablesHandler } from './middleware/handlers/api/get-variables.handler';
import { HealthHandler } from './middleware/handlers/api/health.handler';
import { InformationHandler } from './middleware/handlers/api/information.handler';
import { InitHandler } from './middleware/handlers/api/init.handler';
import { PassThroughsHandler } from './middleware/handlers/api/pass-throughs.handler';
import { RecordHandler } from './middleware/handlers/api/record.handler';
import { SelectPresetHandler } from './middleware/handlers/api/select-preset.handler';
import { SetVariableHandler } from './middleware/handlers/api/set-variable.handler';
import { UpdateMocksHandler } from './middleware/handlers/api/update-mocks.handler';
import { EchoRequestHandler } from './middleware/handlers/mock/echo.request.handler';
import { MockRequestHandler } from './middleware/handlers/mock/mock.request.handler';
import { RecordResponseHandler } from './middleware/handlers/mock/record.response.handler';
import { Middleware } from './middleware/middleware';
import { FileLoader } from './processor/file.loader';
import { MocksProcessor } from './processor/mocks.processor';
import { PresetsProcessor } from './processor/presets.processor';
import { Processor } from './processor/processor';
import { State } from './state/state';

// IOC configuration
const container = new Container();
container.bind<Configuration>('Configuration').toConstantValue(DefaultConfiguration);
container.bind<State>('State').to(State).inSingletonScope();

container.bind<InformationHandler>('InformationHandler').to(InformationHandler);
container.bind<InitHandler>('InitHandler').to(InitHandler);
container.bind<InstanceHolder>('InstanceHolder').to(InstanceHolder).inSingletonScope();
container.bind<HealthHandler>('HealthHandler').to(HealthHandler);

container.bind<EchoRequestHandler>('EchoRequestHandler').to(EchoRequestHandler);
container.bind<MockRequestHandler>('MockRequestHandler').to(MockRequestHandler);
container.bind<RecordResponseHandler>('RecordResponseHandler').to(RecordResponseHandler);

container.bind<GetMocksHandler>('GetMocksHandler').to(GetMocksHandler);
container.bind<UpdateMocksHandler>('UpdateMocksHandler').to(UpdateMocksHandler);

container.bind<GetPresetsHandler>('GetPresetsHandler').to(GetPresetsHandler);
container.bind<SelectPresetHandler>('SelectPresetHandler').to(SelectPresetHandler);

container.bind<GetVariablesHandler>('GetVariablesHandler').to(GetVariablesHandler);
container.bind<SetVariableHandler>('SetVariableHandler').to(SetVariableHandler);
container.bind<DeleteVariableHandler>('DeleteVariableHandler').to(DeleteVariableHandler);

container.bind<DefaultsHandler>('DefaultsHandler').to(DefaultsHandler);
container.bind<PassThroughsHandler>('PassThroughsHandler').to(PassThroughsHandler);

container.bind<RecordHandler>('RecordHandler').to(RecordHandler);
container.bind<GetRecordedResponseHandler>('GetRecordedResponseHandler').to(GetRecordedResponseHandler);
container.bind<GetRecordingsHandler>('GetRecordingsHandler').to(GetRecordingsHandler);

container.bind<FileLoader>('FileLoader').to(FileLoader);
container.bind<MocksProcessor>('MocksProcessor').to(MocksProcessor);
container.bind<PresetsProcessor>('PresetsProcessor').to(PresetsProcessor);
container.bind<Processor>('Processor').to(Processor);
container.bind<NextHandleFunction>('JsonBodyParser').toConstantValue(bodyParser.json());
container.bind<Middleware>('Middleware').to(Middleware);

container.bind<CreateMockHandler>('CreateMockHandler').to(CreateMockHandler);
container.bind<CreatePresetHandler>('CreatePresetHandler').to(CreatePresetHandler);
container.bind<AddMockScenarioToPresetHandler>('AddMockScenarioToPresetHandler').to(AddMockScenarioToPresetHandler);

export default container;
