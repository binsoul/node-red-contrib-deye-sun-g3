interface Definition {
    name: string;
    type: 'unsigned' | 'signed' | 'string';
    scale?: number;
    offset?: number;
    registers: Array<number>;
    unit: string;
}

export interface RegisterValues {
    [key: string]: number | string | null;
    id: string;
    statusCode: number;
    totalEnergy: number;
    totalEnergyToday: number;
    acPower: number;
    acVoltage: number;
    acCurrent: number;
    acFrequency: number;
    pv1Voltage: number;
    pv1Current: number;
    pv1TotalEnergy: number;
    pv1TotalEnergyToday: number;
    pv2Voltage: number;
    pv2Current: number;
    pv2TotalEnergy: number;
    pv2TotalEnergyToday: number;
    pv3Voltage: number;
    pv3Current: number;
    pv3TotalEnergy: number;
    pv3TotalEnergyToday: number;
    pv4Voltage: number;
    pv4Current: number;
    pv4TotalEnergy: number;
    pv4TotalEnergyToday: number;
    temperature: number | null;
    uptime: number;
    operatingPower: number;
}

export class DeyeRegisters {
    private dataDefinition: Array<Definition> = [
        { name: 'id', type: 'string', registers: [0, 1, 2, 3, 4], unit: '' },
        { name: 'statusCode', scale: 1, type: 'unsigned', registers: [56], unit: '' },
        { name: 'totalEnergy', scale: 0.1, type: 'unsigned', registers: [60, 61], unit: 'kWh' },
        { name: 'totalEnergyToday', scale: 0.1, type: 'unsigned', registers: [57], unit: 'kWh' },
        { name: 'acPower', scale: 0.1, type: 'unsigned', registers: [83, 84], unit: 'W' },
        { name: 'acVoltage', scale: 0.1, type: 'unsigned', registers: [70], unit: 'V' },
        { name: 'acCurrent', scale: 0.1, type: 'signed', registers: [73], unit: 'A' },
        { name: 'acFrequency', scale: 0.01, type: 'unsigned', registers: [76], unit: 'Hz' },
        { name: 'pv1Voltage', scale: 0.1, type: 'unsigned', registers: [106], unit: 'V' },
        { name: 'pv1Current', scale: 0.1, type: 'unsigned', registers: [107], unit: 'A' },
        { name: 'pv1TotalEnergy', scale: 0.1, type: 'unsigned', registers: [66, 67], unit: 'kWh' },
        { name: 'pv1TotalEnergyToday', scale: 0.1, type: 'unsigned', registers: [62], unit: 'kWh' },
        { name: 'pv2Voltage', scale: 0.1, type: 'unsigned', registers: [108], unit: 'V' },
        { name: 'pv2Current', scale: 0.1, type: 'unsigned', registers: [109], unit: 'A' },
        { name: 'pv2TotalEnergy', scale: 0.1, type: 'unsigned', registers: [68, 69], unit: 'kWh' },
        { name: 'pv2TotalEnergyToday', scale: 0.1, type: 'unsigned', registers: [63], unit: 'kWh' },
        { name: 'pv3Voltage', scale: 0.1, type: 'unsigned', registers: [110], unit: 'V' },
        { name: 'pv3Current', scale: 0.1, type: 'unsigned', registers: [111], unit: 'A' },
        { name: 'pv3TotalEnergy', scale: 0.1, type: 'unsigned', registers: [71, 72], unit: 'kWh' },
        { name: 'pv3TotalEnergyToday', scale: 0.1, type: 'unsigned', registers: [64], unit: 'kWh' },
        { name: 'pv4Voltage', scale: 0.1, type: 'unsigned', registers: [112], unit: 'V' },
        { name: 'pv4Current', scale: 0.1, type: 'unsigned', registers: [113], unit: 'A' },
        { name: 'pv4TotalEnergy', scale: 0.1, type: 'unsigned', registers: [74, 75], unit: 'kWh' },
        { name: 'pv4TotalEnergyToday', scale: 0.1, type: 'unsigned', registers: [65], unit: 'kWh' },
        { name: 'temperature', scale: 0.01, offset: 1000, type: 'unsigned', registers: [87], unit: '°C' },
        { name: 'uptime', scale: 1, type: 'unsigned', registers: [59], unit: 'm' },
        { name: 'operatingPower', scale: 0.1, type: 'unsigned', registers: [77], unit: 'W' },
    ];

    public parse(modbusRegisters: Array<number>): RegisterValues {
        const result: RegisterValues = {
            id: '',
            statusCode: 0,
            totalEnergy: 0,
            totalEnergyToday: 0,
            acPower: 0,
            acVoltage: 0,
            acCurrent: 0,
            acFrequency: 0,
            pv1Voltage: 0,
            pv1Current: 0,
            pv1TotalEnergy: 0,
            pv1TotalEnergyToday: 0,
            pv2Voltage: 0,
            pv2Current: 0,
            pv2TotalEnergy: 0,
            pv2TotalEnergyToday: 0,
            pv3Voltage: 0,
            pv3Current: 0,
            pv3TotalEnergy: 0,
            pv3TotalEnergyToday: 0,
            pv4Voltage: 0,
            pv4Current: 0,
            pv4TotalEnergy: 0,
            pv4TotalEnergyToday: 0,
            temperature: 0,
            uptime: 0,
            operatingPower: 0,
        };

        for (const definition of this.dataDefinition) {
            let value;
            const type = definition.type;
            if (type === 'unsigned') {
                value = this.parseUnsigned(modbusRegisters, definition.registers, definition.scale || 1, definition.offset || 0);
            } else if (type === 'signed') {
                value = this.parseSigned(modbusRegisters, definition.registers, definition.scale || 1, definition.offset || 0);
            } else if (type === 'string') {
                value = this.parseString(modbusRegisters, definition.registers);
            } else {
                value = 'unknown';
            }

            result[definition.name] = value;
        }

        return result;
    }

    private parseUnsigned(modbusRegisters: Array<number>, registers: Array<number>, scale: number, offset: number): number {
        let value = 0;
        let shift = 0;
        for (const index of registers) {
            const temp = modbusRegisters[index];
            value += (temp & 0xffff) << shift;
            shift += 16;
        }

        value = value - offset;
        value = value * scale;

        return this.round(value, '4');
    }

    private parseSigned(modbusRegisters: Array<number>, registers: Array<number>, scale: number, offset: number): number {
        let value = 0;
        let shift = 0;
        let maxint = 0;
        for (const index of registers) {
            maxint <<= 16;
            maxint |= 0xffff;
            const temp = modbusRegisters[index];
            value += (temp & 0xffff) << shift;
            shift += 16;
        }

        value = value - offset;

        if (value > maxint / 2) {
            value = (value - maxint) * scale;
        } else {
            value = value * scale;
        }

        return this.round(value, '4');
    }

    private parseString(modbusRegisters: Array<number>, registers: Array<number>): string {
        let value = '';
        for (const index of registers) {
            const temp = modbusRegisters[index];
            value = value + String.fromCharCode(temp >> 8) + String.fromCharCode(temp & 0xff);
        }

        return value;
    }

    private round(value: number, decimals: string): number {
        return Number(Math.round(<number>(<unknown>(value + 'e' + decimals))) + 'e-' + decimals);
    }
}
