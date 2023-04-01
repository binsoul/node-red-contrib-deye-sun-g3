export class SolarmanV5 {
    private readonly frameStart: Buffer;
    private readonly frameControlCode: Buffer;
    private readonly frameLoggerSerial: Buffer;
    private readonly frameType: Buffer;
    private readonly frameSensorType: Buffer;
    private readonly frameDeliveryTime: Buffer;
    private readonly framePowerOnTime: Buffer;
    private readonly frameOffsetTime: Buffer;
    private readonly frameChecksum: Buffer;
    private readonly frameEnd: Buffer;

    private sequenceNumber: number | null;

    constructor(serialNumber: string) {
        this.sequenceNumber = null;

        this.frameStart = Buffer.from('A5', 'hex');
        this.frameType = Buffer.from('02', 'hex');
        this.frameSensorType = Buffer.from('0000', 'hex');
        this.frameDeliveryTime = Buffer.from('00000000', 'hex');
        this.framePowerOnTime = Buffer.from('00000000', 'hex');
        this.frameOffsetTime = Buffer.from('00000000', 'hex');
        this.frameChecksum = Buffer.from('00', 'hex');
        this.frameEnd = Buffer.from('15', 'hex');

        this.frameControlCode = Buffer.alloc(2);
        this.frameControlCode.writeUInt16LE(0x4510, 0);

        this.frameLoggerSerial = Buffer.alloc(4);
        this.frameLoggerSerial.writeUInt32LE(Number(serialNumber), 0);
    }

    private calculateFrameChecksum(frame: Buffer) {
        let checksum = 0;
        for (let i = 1; i < frame.length - 2; i++) {
            checksum += frame[i] & 0xff;
        }

        return Number(checksum & 0xff);
    }

    private getNextSequenceNumber() {
        if (this.sequenceNumber === null) {
            this.sequenceNumber = 1;
        } else {
            this.sequenceNumber++;
        }

        if (this.sequenceNumber > 255) {
            this.sequenceNumber = 1;
        }

        return this.sequenceNumber;
    }

    public wrapModbusFrame(modbusFrame: Buffer): Buffer {
        const length = Buffer.alloc(2);
        length.writeUInt16LE(15 + modbusFrame.length, 0);

        const serial = Buffer.alloc(2);
        serial.writeUInt16LE(this.getNextSequenceNumber(), 0);

        const header = Buffer.concat([this.frameStart, length, this.frameControlCode, serial, this.frameLoggerSerial]);
        const payload = Buffer.concat([this.frameType, this.frameSensorType, this.frameDeliveryTime, this.framePowerOnTime, this.frameOffsetTime, modbusFrame]);
        const footer = Buffer.concat([this.frameChecksum, this.frameEnd]);

        const frame = Buffer.concat([header, payload, footer]);

        frame[frame.length - 2] = this.calculateFrameChecksum(frame);

        return frame;
    }

    public unwrapModbusFrame(solarmanFrame: Buffer, ignoreProtocolErrors: boolean): Buffer {
        let frameLength = solarmanFrame.length;
        const payloadLength = solarmanFrame.readUInt16LE(1);

        const headerLength = 13;

        if (frameLength !== headerLength + payloadLength) {
            if (!ignoreProtocolErrors) {
                throw new Error('Frame length does not match payload length.');
            }

            frameLength = headerLength + payloadLength;
        }

        if (solarmanFrame[0] !== this.frameStart.readUInt8() || solarmanFrame[frameLength - 1] !== this.frameEnd.readUInt8()) {
            throw new Error('Frame contains invalid start or end values.');
        }

        if (solarmanFrame[frameLength - 2] !== this.calculateFrameChecksum(solarmanFrame)) {
            throw new Error('Frame contains invalid V5 checksum.');
        }

        if (solarmanFrame[5] !== this.sequenceNumber) {
            if (!ignoreProtocolErrors) {
                throw new Error('Frame contains invalid sequence number.');
            }
        }

        if (solarmanFrame.subarray(7, 11).toString() !== this.frameLoggerSerial.toString()) {
            throw new Error('Frame contains incorrect data logger serial number.');
        }

        if (solarmanFrame.readUint16LE(3) !== 0x1510) {
            throw new Error('Frame contains incorrect control code.');
        }

        if (solarmanFrame[11] !== 0x02) {
            throw new Error('Frame contains invalid frame type.');
        }

        const modbusFrame = solarmanFrame.subarray(25, frameLength - 2);

        if (modbusFrame.length < 5) {
            throw new Error('Frame does not contain a valid Modbus RTU frame.');
        }

        return modbusFrame;
    }
}
