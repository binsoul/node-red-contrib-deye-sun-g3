import { Action, InputDefinition, Output, OutputDefinition } from '@binsoul/node-red-bundle-processing';
import type { Configuration } from '../Configuration';
import { Storage } from '../Storage';

export class DailyResetAction implements Action {
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
        const isAvailable = this.storage.isAvailable();

        this.storage.setAvailable(true);
        this.storage.resetCounters();
        const data = this.storage.getData();
        this.storage.setAvailable(isAvailable);

        if (data !== null) {
            data.isAvailable = isAvailable;

            result.setValue('output', data);

            result.setNodeStatus({
                fill: 'green',
                shape: 'dot',
                text: `daily reset`,
            });
        }

        return result;
    }
}
