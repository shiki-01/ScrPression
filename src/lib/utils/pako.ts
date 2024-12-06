import pako from 'pako';
import CryptoJS from 'crypto-js';

const compressEncryptAndSave = async (jsonData: string, password: string) => {
    // JSONを文字列に変換して圧縮
    const jsonString = JSON.stringify(jsonData);
    const compressed = pako.deflate(jsonString);
    
    // 暗号化用のソルトと初期ベクトルを生成
    const salt = CryptoJS.lib.WordArray.random(128/8);
    const iv = CryptoJS.lib.WordArray.random(128/8);
    
    // 暗号化キーの生成
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 128/32,
      iterations: 50000,
      hasher: CryptoJS.algo.SHA256
    });
    
    // 圧縮データを暗号化
    const encrypted = CryptoJS.AES.encrypt(
      CryptoJS.lib.WordArray.create(compressed),
      key,
      { iv: iv }
    );
    
    // メタデータを含めてBlobを作成
    const data = {
      salt: salt.toString(),
      iv: iv.toString(),
      data: encrypted.toString()
    };
    
    const blob = new Blob([JSON.stringify(data)], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    
    // ダウンロード
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.secz';
    a.click();
    window.URL.revokeObjectURL(url);
}

const decryptAndDecompress = async (file: File, password: string) => {
    const text = await file.text();
    const { salt, iv, data } = JSON.parse(text);
    
    const key = CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse(salt), {
      keySize: 128/32,
      iterations: 50000,
      hasher: CryptoJS.algo.SHA256
    });
    
    // 復号化
    const decrypted = CryptoJS.AES.decrypt(data, key, {
      iv: CryptoJS.enc.Hex.parse(iv)
    });
    
    // バイナリデータに変換して解凍
    const compressed = new Uint8Array(decrypted.words.length * 4);
    for (let i = 0; i < decrypted.words.length; i++) {
      const word = decrypted.words[i];
      compressed[i * 4] = (word >> 24) & 0xff;
      compressed[i * 4 + 1] = (word >> 16) & 0xff;
      compressed[i * 4 + 2] = (word >> 8) & 0xff;
      compressed[i * 4 + 3] = word & 0xff;
    }
    
    const decompressed = pako.inflate(compressed, { to: 'string' });
    return JSON.parse(decompressed);
}

export { compressEncryptAndSave, decryptAndDecompress };