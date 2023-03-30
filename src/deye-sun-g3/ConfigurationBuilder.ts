import { Configuration } from './Configuration';
import type { UserConfiguration } from './UserConfiguration';

const getString = function (value: unknown, defaultValue: string): string {
    const result = value || defaultValue;

    const stringValue = '' + result;
    if (stringValue.trim() === '') {
        return defaultValue;
    }

    return stringValue;
};

/**
 * Creates a sanitized configuration from user input.
 */
export function buildConfiguration(config: UserConfiguration): Configuration {
    const outputTarget = getString(config.outputTarget, 'msg');
    const outputProperty = getString(config.outputProperty, 'payload');
    const deviceIp = getString(config.deviceIp, '');
    const deviceSerialNumber = getString(config.deviceSerialNumber, '');
    const deviceTimeout = Number(config.deviceTimeout || 30);
    const updateMode = getString(config.updateMode, 'never');
    const updateFrequency = Number(config.updateFrequency || 5);

    return new Configuration(outputTarget, outputProperty, deviceIp, deviceSerialNumber, deviceTimeout, updateMode, updateFrequency);
}
