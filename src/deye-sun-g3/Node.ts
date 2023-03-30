import { MessageHandler } from '@binsoul/node-red-bundle-processing';
import type { Node, NodeInitializer } from 'node-red';
import { ActionFactory } from './ActionFactory';
import { buildConfiguration } from './ConfigurationBuilder';
import type { UserConfiguration } from './UserConfiguration';

const nodeInitializer: NodeInitializer = (RED): void => {
    function NodeConstructor(this: Node, userConfiguration: UserConfiguration): void {
        RED.nodes.createNode(this, userConfiguration);

        const configuration = buildConfiguration(userConfiguration);
        const actionFactory = new ActionFactory(RED, this, configuration);
        const messageHandler = new MessageHandler(RED, this, actionFactory);

        actionFactory.setup();

        this.on('input', (msg, send, done) => messageHandler.handle(msg, send, done));
        this.on('close', () => actionFactory.teardown());
    }

    RED.nodes.registerType('binsoul-deye-sun-g3', NodeConstructor);
};

export = nodeInitializer;
