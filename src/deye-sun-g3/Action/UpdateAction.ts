import { Action, InputDefinition, Output, OutputDefinition } from '@binsoul/node-red-bundle-processing';
import { ModbusRtu } from '@binsoul/nodejs-modbus';
import { SolarmanV5 } from '@binsoul/nodejs-solarman';
import * as net from 'net';
import { NodeStatus } from 'node-red';
import type { Configuration } from '../Configuration';
import { DeyeRegisters } from '../DeyeRegisters';
import { Storage } from '../Storage';

export class UpdateAction implements Action {
    private readonly configuration: Configuration;
    private readonly storage: Storage;
    private readonly outputCallback: () => void;
    private readonly nodeStatusCallback: (status: NodeStatus) => void;

    constructor(configuration: Configuration, storage: Storage, outputCallback: () => void, nodeStatusCallback: (status: NodeStatus) => void) {
        this.configuration = configuration;
        this.storage = storage;
        this.outputCallback = outputCallback;
        this.nodeStatusCallback = nodeStatusCallback;
    }

    defineInput(): InputDefinition {
        return new InputDefinition();
    }

    defineOutput(): OutputDefinition {
        return new OutputDefinition();
    }

    execute(): Output {
        const client = new net.Socket();
        client.setTimeout(5000);

        let hasConnected = false;
        let errorMessage = '';
        let retryCount = 0;

        const unitAddress = 1;
        const firstRegister = 0x0003;
        const lastRegister = 0x0080;

        const modbus = new ModbusRtu(unitAddress);
        const modbusFrame = modbus.requestHoldingRegisters(firstRegister, lastRegister);

        const solarman = new SolarmanV5(this.configuration.deviceSerialNumber, true);
        const request = solarman.wrapModbusFrame(modbusFrame);

        // Functions to handle socket events
        const makeConnection = () => {
            client.connect({ host: this.configuration.deviceIp, port: 8899 });
        };

        const connectEventHandler = () => {
            hasConnected = true;
            this.storage.setConnected();
            client.write(request);
        };

        const dataEventHandler = (data: Buffer) => {
            try {
                const modbusFrame = solarman.unwrapModbusFrame(data);
                const values = modbus.fetchHoldingRegisters(modbusFrame);

                const parser = new DeyeRegisters();
                this.storage.setData(parser.parse(values));

                this.outputCallback();
            } catch (error) {
                if (error instanceof Error) {
                    this.nodeStatusCallback({
                        fill: 'red',
                        shape: 'dot',
                        text: error.message,
                    });
                }
            }

            client.end();
        };

        const timeoutEventHandler = () => {
            errorMessage = 'Connection timed out';
            client.end();
        };

        const errorEventHandler = (error: Error) => {
            errorMessage = error.message;
            client.end();
        };

        const closeEventHandler = () => {
            if (hasConnected) {
                return;
            }

            if (!this.storage.isAvailable()) {
                this.nodeStatusCallback({
                    fill: 'yellow',
                    shape: 'dot',
                    text: 'unavailable',
                });
            } else if (retryCount < 5) {
                retryCount++;
                this.nodeStatusCallback({
                    fill: 'yellow',
                    shape: 'dot',
                    text: 'retry ' + retryCount,
                });

                setTimeout(makeConnection, 5000);
            } else {
                this.nodeStatusCallback({
                    fill: 'red',
                    shape: 'dot',
                    text: errorMessage,
                });
            }
        };

        client.on('connect', connectEventHandler);
        client.on('data', dataEventHandler);
        client.on('timeout', timeoutEventHandler);
        client.on('error', errorEventHandler);
        client.on('close', closeEventHandler);

        this.nodeStatusCallback({
            fill: 'yellow',
            shape: 'dot',
            text: 'updating',
        });

        makeConnection();

        return new Output();
    }
}
