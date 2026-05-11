const BASE62 =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encode(num) {
  if (num === 0) return "0";

  let shortCode = "";

  while (num > 0) {
    const remainder = num % 62;

    shortCode = BASE62[remainder] + shortCode;

    num = Math.floor(num / 62);
  }

  return shortCode;
}

 function decode(str) {
  let num = 0;

  for (let i = 0; i < str.length; i++) {
    num = num * 62 + BASE62.indexOf(str[i]);
  }

  return num;
}

module.exports={encode,decode}
