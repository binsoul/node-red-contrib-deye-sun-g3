import { Action, InputDefinition, Output, OutputDefinition } from '@binsoul/node-red-bundle-processing';
import * as net from 'net';
import type { Configuration } from '../Configuration';
import { DeyeRegisters } from '../DeyeRegisters';
import { Modbus } from '../Modbus';
import { SolarmanV5 } from '../SolarmanV5';
import { Storage } from '../Storage';

export class UpdateAction implements Action {
    private readonly configuration: Configuration;
    private readonly storage: Storage;
    private readonly outputCallback: () => void;

    constructor(configuration: Configuration, storage: Storage, outputCallback: () => void) {
        this.configuration = configuration;
        this.storage = storage;
        this.outputCallback = outputCallback;
    }

    defineInput(): InputDefinition {
        return new InputDefinition();
    }

    defineOutput(): OutputDefinition {
        return new OutputDefinition();
    }

    execute(): Output {
        const client = new net.Socket();
        client.setTimeout(10000);

        let hasConnected = false;
        let retryCount = 0;

        const slaveId = 1;
        const dataAddressFrom = 0x0003;
        const dataAddressTo = 0x0080;

        const modbus = new Modbus();
        const modbusFrame = modbus.writeFC3(slaveId, dataAddressFrom, dataAddressTo);

        const solarman = new SolarmanV5(this.configuration.deviceSerialNumber);
        const request = solarman.wrapModbusFrame(modbusFrame);

        // Functions to handle socket events
        const makeConnection = () => {
            client.connect({ host: this.configuration.deviceIp, port: 8899 });
        };

        const connectEventHandler = () => {
            hasConnected = true;
            client.write(request);
        };

        const dataEventHandler = (data: Buffer) => {
            try {
                const modbusFrame = solarman.unwrapModbusFrame(data);
                const values = modbus.readFC3(modbusFrame);

                const parser = new DeyeRegisters();
                this.storage.setData(parser.parse(values));

                this.outputCallback();
            } catch (error) {
                if (error instanceof Error) {
                    this.storage.setDataError(error.message);
                }
            }

            client.end();
        };

        const timeoutEventHandler = () => {
            this.storage.setConnectionError('Connection timed out');
            client.end();
        };

        const errorEventHandler = (err: Error) => {
            this.storage.setConnectionError(err.message);
            client.end();
        };

        const closeEventHandler = () => {
            if (hasConnected) {
                return;
            }

            if (retryCount < 6) {
                retryCount++;
                setTimeout(makeConnection, 5000);
            } else {
                this.outputCallback();
            }
        };

        client.on('connect', connectEventHandler);
        client.on('data', dataEventHandler);
        client.on('timeout', timeoutEventHandler);
        client.on('error', errorEventHandler);
        client.on('close', closeEventHandler);

        makeConnection();

        const result = new Output();
        result.setNodeStatus({
            fill: 'yellow',
            shape: 'dot',
            text: 'updating',
        });

        return result;
    }
}
