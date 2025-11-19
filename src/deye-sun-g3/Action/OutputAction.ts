import { Action, InputDefinition, Output, OutputDefinition } from '@binsoul/node-red-bundle-processing';
import type { Configuration } from '../Configuration.js';
import { Storage } from '../Storage.js';

export class OutputAction implements Action {
    private readonly configuration: Configuration;
    private storage: Storage;

    constructor(configuration: Configuration, storage: Storage) {
        this.configuration = configuration;
        this.storage = storage;
    }

    defineInput(): InputDefinition {
        return new InputDefinition();
    }

    defineOutput(): OutputDefinition {
        const result = new OutputDefinition();

        result.set('output', {
            target: this.configuration.outputTarget,
            property: this.configuration.outputProperty,
            type: 'object',
            channel: 0,
        });

        return result;
    }

    execute(): Output {
        const result = new Output();

        const data = this.storage.getData();
        if (data !== null) {
            result.setValue('output', data);

            result.setNodeStatus({
                fill: 'green',
                shape: 'dot',
                text: `${data.output.power} W`,
            });
        }

        return result;
    }
}
