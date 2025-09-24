// tar.bundle.js - Concaténation manuelle de tar-js pour le navigateur

(function (window) {
    "use strict";

    // --- Contenu de utils.js ---
    var utils = {};

    utils.stringToUint8 = function (str) {
        var i, charCode,
            arr = new Uint8Array(str.length);

        for (i = 0; i < str.length; i += 1) {
            charCode = str.charCodeAt(i);
            if (charCode > 255) {
                throw "Characters must be in range [0, 255]";
            }
            arr[i] = charCode;
        }
        return arr;
    };

    utils.uint8ToBase64 = function (uint8) {
        var i,
            extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
            output = "",
            temp,
            length = uint8.length - extraBytes;

        var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

        // go through the array every three bytes, we'll deal with trailing stuff later
        for (i = 0; i < length; i += 3) {
            temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
            output += b64.charAt((temp >> 18) & 0x3F) + b64.charAt((temp >> 12) & 0x3F) + b64.charAt((temp >> 6) & 0x3F) + b64.charAt(temp & 0x3F);
        }

        // pad the end with zeros, according to the RFC
        if (extraBytes === 1) {
            temp = uint8[length];
            output += b64.charAt(temp >> 2);
            output += b64.charAt((temp << 4) & 0x3F);
            output += "==";
        } else if (extraBytes === 2) {
            temp = (uint8[length] << 8) + (uint8[length + 1]);
            output += b64.charAt((temp >> 10) & 0x3F);
            output += b64.charAt((temp >> 4) & 0x3F);
            output += b64.charAt((temp << 2) & 0x3F);
            output += "=";
        }

        return output;
    };
    
    utils.pad = function (num, bytes, base) {
        num = num.toString(base || 8);
        return "000000000000".substr(num.length + 12 - bytes) + num;
    };

    utils.extend = function (orig, n, sz, bl) {
        var i,
            newSize = n + sz,
            newBlockSize = bl,
            newOut;

        if (newSize > orig.length) {
            newBlockSize = newBlockSize || orig.length;
            newOut = new Uint8Array(Math.ceil(newSize / newBlockSize) * newBlockSize);
            newOut.set(orig);
        } else {
            newOut = orig;
        }

        return newOut;
    };

    utils.clean = function (length) {
        var i,
            out = new Uint8Array(length);
        for (i = 0; i < length; i += 1) {
            out[i] = 0;
        }
        return out;
    };


    // --- Contenu de header.js ---
    var header = {};
    var recordSize = 512;

    header.structure = [
        { 'field': 'fileName', 'length': 100 },
        { 'field': 'fileMode', 'length': 8 },
        { 'field': 'uid', 'length': 8 },
        { 'field': 'gid', 'length': 8 },
        { 'field': 'fileSize', 'length': 12 },
        { 'field': 'mtime', 'length': 12 },
        { 'field': 'checksum', 'length': 8 },
        { 'field': 'type', 'length': 1 },
        { 'field': 'linkedFile', 'length': 100 },
        { 'field': 'ustar', 'length': 8 },
        { 'field': 'owner', 'length': 32 },
        { 'field': 'group', 'length': 32 },
        { 'field': 'major', 'length': 8 },
        { 'field': 'minor', 'length': 8 },
        { 'field': 'prefix', 'length': 155 },
        { 'field': 'padding', 'length': 12 }
    ];

    header.format = function (data) {
        var i, j,
            _header = utils.clean(recordSize),
            offset = 0;

        for (i = 0; i < header.structure.length; i += 1) {
            var field = header.structure[i].field,
                length = header.structure[i].length,
                value = data[field] || "";

            for (j = 0; j < value.length; j += 1) {
                _header[offset] = value.charCodeAt(j);
                offset += 1;
            }
            offset += length - j; // space it out with nulls
        }

        return _header;
    };


    // --- Contenu de tar.js (modifié) ---
    var recordSize = 512,
        blockSize;

    function Tar(recordsPerBlock) {
        this.written = 0;
        blockSize = (recordsPerBlock || 20) * recordSize;
        this.out = utils.clean(blockSize);
    }

    Tar.prototype.append = function (filepath, input, opts, callback) {
        var data,
            checksum,
            mode,
            mtime,
            uid,
            gid,
            headerArr;

        if (typeof input === 'string') {
            input = utils.stringToUint8(input);
        } else if (input.constructor !== Uint8Array.prototype.constructor) {
            throw 'Invalid input type. You gave me: ' + input.constructor.toString().match(/function\s*([$A-Za-z_][0-9A-Za-z_]*)\s*\(/)[1];
        }

        if (typeof opts === 'function') {
            callback = opts;
            opts = {};
        }

        opts = opts || {};

        mode = opts.mode || parseInt('777', 8) & 0xfff;
        mtime = opts.mtime || Math.floor(+new Date() / 1000);
        uid = opts.uid || 0;
        gid = opts.gid || 0;

        data = {
            fileName: filepath,
            fileMode: utils.pad(mode, 7),
            uid: utils.pad(uid, 7),
            gid: utils.pad(gid, 7),
            fileSize: utils.pad(input.length, 11),
            mtime: utils.pad(mtime, 11),
            checksum: '        ',
            type: '0', // just a file
            ustar: 'ustar  ',
            owner: opts.owner || '',
            group: opts.group || ''
        };

        checksum = 0;
        Object.keys(data).forEach(function (key) {
            var i, value = data[key], length;

            for (i = 0, length = value.length; i < length; i += 1) {
                checksum += value.charCodeAt(i);
            }
        });

        data.checksum = utils.pad(checksum, 6) + "\u0000 ";

        headerArr = header.format(data);

        this.out.set(headerArr, this.written);
        this.written += headerArr.length;

        if (this.written + input.length > this.out.length) {
            this.out = utils.extend(this.out, this.written, input.length, blockSize);
        }

        this.out.set(input, this.written);
        this.written += input.length + (recordSize - (input.length % recordSize || recordSize));

        if (this.out.length - this.written < recordSize * 2) {
            this.out = utils.extend(this.out, this.written, recordSize * 2, blockSize);
        }

        if (typeof callback === 'function') {
            callback(this.out);
        }

        return this.out;
    };

    Tar.prototype.clear = function () {
        this.written = 0;
        this.out = utils.clean(blockSize);
    };

    // Exposer la classe Tar à la fenêtre globale
    window.Tar = Tar;

}(window));