/**
 * 获取图像类型
 *
 * @param {Array.<number>} buffer - 图像数据 buffer
 * @returns {string} - Mime Type
 */
const getMimeType = buffer => {
  if (!buffer) {
    // 图像 buffer 为空，未能识别到该文件类型
    return "";
  }

  // 通过文件特征码判断 MIME 类型，目前支持 PNG / JPEG
  const imageBufferHeaders = [
    {
      bufBegin: [0xff, 0xd8],
      bufEnd: [0xff, 0xd9],
      mimeType: "image/jpeg"
    },
    {
      bufBegin: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      mimeType: "image/png"
    }
  ];

  for (const imageBufferHeader of imageBufferHeaders) {
    let isEqual;
    // 判断标识头前缀
    if (imageBufferHeader.bufBegin) {
      const buf = Buffer.from(imageBufferHeader.bufBegin);
      isEqual = buf.equals(buffer.slice(0, imageBufferHeader.bufBegin.length));
    }
    // 判断标识头后缀
    if (isEqual && imageBufferHeader.bufEnd) {
      const buf = Buffer.from(imageBufferHeader.bufEnd);
      isEqual = buf.equals(buffer.slice(-imageBufferHeader.bufEnd.length));
    }
    if (isEqual) {
      return imageBufferHeader.mimeType;
    }
  }
  // 未能识别到该文件类型
  return "";
};

module.exports = {
  getMimeType
};
