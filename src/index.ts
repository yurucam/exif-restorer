export class ExifRestorer {
  private static KEY_STR =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  static encode64(input: Uint8Array): string {
    let output: string = "";
    let chr1: number;
    let chr2: number;
    let chr3: number;
    let enc1: number;
    let enc2: number;
    let enc3: number;
    let enc4: number;
    let i: number = 0;

    do {
      chr1 = input[i++];
      chr2 = input[i++];
      chr3 = input[i++];

      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;

      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }

      output =
        output +
        this.KEY_STR.charAt(enc1) +
        this.KEY_STR.charAt(enc2) +
        this.KEY_STR.charAt(enc3) +
        this.KEY_STR.charAt(enc4);
      chr1 = chr2 = chr3 = null;
      enc1 = enc2 = enc3 = enc4 = null;
    } while (i < input.length);

    return output;
  }

  static restore(origFileBase64: string, resizedFileBase64: string): string {
    const extension = resizedFileBase64.match(/data:image\/(\w+);base64,/)[0];

    if (!origFileBase64.match(/data:image\/\w+;base64,/)) {
      return resizedFileBase64;
    }

    const rawImage = this.decode64(
      origFileBase64.replace(/data:image\/\w+;base64,/, "")
    );

    const segments = this.slice2Segments(rawImage);

    const image = this.exifManipulation(resizedFileBase64, segments);

    return extension + this.encode64(image);
  }

  static exifManipulation(
    resizedFileBase64: string,
    segments: number[][]
  ): Uint8Array {
    const exifArray = this.getExifArray(segments);
    const newImageArray = this.insertExif(resizedFileBase64, exifArray);
    const buffer = new Uint8Array(newImageArray);

    return buffer;
  }

  static getExifArray(segments: number[][]): number[] {
    let seg: number[];

    for (let x = 0; x < segments.length; x++) {
      seg = segments[x];
      if (seg[0] == 255 && seg[1] == 225) {
        return seg;
      }
    }

    return [];
  }

  static insertExif(resizedFileBase64: string, exifArray: number[]): number[] {
    let imageData = resizedFileBase64.replace(/data:image\/\w+;base64,/, "");
    let buffer = this.decode64(imageData);
    let separatePoint = buffer.indexOf(255, 3);
    let mae = buffer.slice(0, separatePoint);
    let ato = buffer.slice(separatePoint);
    let array = mae;

    array = array.concat(exifArray);
    array = array.concat(ato);

    return array;
  }

  static slice2Segments(rawImageArray: number[]): number[][] {
    let head: number = 0;
    let segments: number[][] = [];

    while (1) {
      if (rawImageArray[head] == 255 && rawImageArray[head + 1] == 218) {
        break;
      }

      if (rawImageArray[head] == 255 && rawImageArray[head + 1] == 216) {
        head += 2;
      } else {
        const length = rawImageArray[head + 2] * 256 + rawImageArray[head + 3];
        const endPoint = head + length + 2;
        const seg = rawImageArray.slice(head, endPoint);
        segments.push(seg);
        head = endPoint;
      }
      if (head > rawImageArray.length) {
        break;
      }
    }

    return segments;
  }

  static decode64(base64: string): number[] {
    let chr1: number;
    let chr2: number;
    let chr3: number;
    let enc1: number;
    let enc2: number;
    let enc3: number;
    let enc4: number;
    let i: number = 0;
    const buffer: number[] = [];

    // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
    if (/[^A-Za-z0-9\+\/\=]/g.exec(base64)) {
      console.error(
        "There were invalid base64 characters in the input text. Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '=' Expect errors in decoding."
      );
      throw new Error(
        "There were invalid base64 characters in the input text. Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '=' Expect errors in decoding."
      );
    }
    base64 = base64.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    do {
      enc1 = this.KEY_STR.indexOf(base64.charAt(i++));
      enc2 = this.KEY_STR.indexOf(base64.charAt(i++));
      enc3 = this.KEY_STR.indexOf(base64.charAt(i++));
      enc4 = this.KEY_STR.indexOf(base64.charAt(i++));

      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;

      buffer.push(chr1);

      if (enc3 != 64) {
        buffer.push(chr2);
      }
      if (enc4 != 64) {
        buffer.push(chr3);
      }

      chr1 = chr2 = chr3 = null;
      enc1 = enc2 = enc3 = enc4 = null;
    } while (i < base64.length);

    return buffer;
  }
}
