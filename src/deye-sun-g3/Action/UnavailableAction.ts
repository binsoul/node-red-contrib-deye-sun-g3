import { Action, InputDefinition, Output, OutputDefinition } from '@binsoul/node-red-bundle-processing';
import type { Configuration } from '../Configuration';
import { Storage } from '../Storage';

export class UnavailableAction implements Action {
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

        this.storage.setAvailable(true);
        this.storage.resetRuntime();
        const data = this.storage.getData();
        this.storage.setAvailable(false);

        if (data !== null) {
            data.isAvailable = false;

            result.setValue('output', data);
        }

        result.setNodeStatus({
            fill: 'yellow',
            shape: 'dot',
            text: 'unavailable',
        });

        return result;
    }
}
