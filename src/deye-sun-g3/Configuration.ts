/**
 * Sanitized configuration generated from user input.
 */
export class Configuration {
    outputProperty: string;
    outputTarget: string;
    deviceIp: string;
    deviceSerialNumber: string;
    deviceTimeout: number;
    updateMode: string;
    updateFrequency: number;

    constructor(outputTarget = 'msg', outputProperty = 'payload', deviceIp: string, deviceSerialNumber: string, deviceTimeout = 30, updateMode = 'never', updateFrequency = 5) {
        this.outputTarget = outputTarget;
        this.outputProperty = outputProperty;
        this.deviceIp = deviceIp;
        this.deviceSerialNumber = deviceSerialNumber;
        this.deviceTimeout = deviceTimeout;
        this.updateMode = updateMode;
        this.updateFrequency = updateFrequency;
    }
}
