export class Modbus {
    public writeFC3(slaveId: number, dataAddressFrom: number, dataAddressTo: number): Buffer {
        const modbusFunction = 0x03;

        const length = dataAddressTo - dataAddressFrom + 1;

        const codeLength = 6;
        const buf = Buffer.alloc(codeLength + 2);

        buf.writeUInt8(slaveId, 0);
        buf.writeUInt8(modbusFunction, 1);
        buf.writeUInt16BE(dataAddressFrom, 2);
        buf.writeUInt16BE(length, 4);

        buf.writeUInt16LE(this.crc16(buf.subarray(0, -2)), codeLength);

        return buf;
    }

    public readFC3(data: Buffer): Array<number> {
        const length = data.readUInt8(2);
        const contents = [];

        for (let i = 0; i < length; i += 2) {
            const reg = data.readUInt16BE(i + 3);
            contents.push(reg);
        }

        return contents;
    }

    private crc16(buffer: Buffer): number {
        let crc = 0xffff;
        let odd;

        for (let i = 0; i < buffer.length; i++) {
            crc = crc ^ buffer[i];

            for (let j = 0; j < 8; j++) {
                odd = crc & 0x0001;
                crc = crc >> 1;
                if (odd) {
                    crc = crc ^ 0xa001;
                }
            }
        }

        return crc;
    }
}
