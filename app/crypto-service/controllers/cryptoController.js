import rs from 'jsrsasign';

export class CryptoController {

  test() {
    const sign = new rs.Signature({alg: 'SHA512withRSA'});
    const keyPair = new rs.KEYUTIL.generateKeypair('RSA', 2048);
    sign.init(keyPair.prvKeyObj);
    sign.updateString('testString');
    const signHex = sign.sign();

    const newSign = new rs.Signature({alg: 'SHA512withRSA'});
    newSign.init(keyPair.pubKeyObj);
    newSign.updateString('testString');
    const isValid = newSign.verify(signHex);

    return {encoded: signHex, verify: isValid, keyPair: keyPair};
  }

  async verifySign(signHex, data, publicPem) {
    try {
      console.log('signHex: ', signHex);
      console.log('data: ', data);
      console.log('publicPem: ', publicPem);

      const newSign = new rs.Signature({alg: 'SHA512withRSA'});
      const publicKey = rs.KEYUTIL.getKey(publicPem);
      newSign.init(publicKey);
      newSign.updateString(data);
      const isValid = newSign.verify(signHex);
      return isValid;
    } catch (error) {
      console.log('Error =====> ', error);
      throw(error);
    }
  }
}