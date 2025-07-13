"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDriveFiles = listDriveFiles;
exports.getDriveFileDetails = getDriveFileDetails;
exports.downloadDriveFile = downloadDriveFile;
exports.uploadDriveFile = uploadDriveFile;
exports.deleteDriveFile = deleteDriveFile;
exports.shareDriveFile = shareDriveFile;
exports.searchDriveFiles = searchDriveFiles;
exports.listGmailMessages = listGmailMessages;
function listDriveFiles(token) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('https://www.googleapis.com/drive/v3/files', {
                            headers: {
                                Authorization: "Bearer ".concat(token),
                            },
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to fetch Drive files');
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, data.files || []];
                case 3:
                    err_1 = _a.sent();
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getDriveFileDetails(token, fileId) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("https://www.googleapis.com/drive/v3/files/".concat(fileId, "?fields=*"), {
                        headers: { Authorization: "Bearer ".concat(token) },
                    })];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to fetch file details');
                    return [4 /*yield*/, response.json()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function downloadDriveFile(token, fileId) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("https://www.googleapis.com/drive/v3/files/".concat(fileId, "?alt=media"), {
                        headers: { Authorization: "Bearer ".concat(token) },
                    })];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to download file');
                    return [4 /*yield*/, response.blob()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function uploadDriveFile(token, file, parentId) {
    return __awaiter(this, void 0, void 0, function () {
        var metadata, boundary, delimiter, closeDelim, reader;
        var _this = this;
        return __generator(this, function (_a) {
            metadata = {
                name: file.name,
                parents: parentId ? [parentId] : undefined,
            };
            boundary = '-------314159265358979323846';
            delimiter = "\r\n--".concat(boundary, "\r\n");
            closeDelim = "\r\n--".concat(boundary, "--");
            reader = new FileReader();
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    reader.onload = function (e) { return __awaiter(_this, void 0, void 0, function () {
                        var contentType, base64Data, multipartRequestBody, response, _a;
                        var _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    contentType = file.type || 'application/octet-stream';
                                    base64Data = btoa((_b = e.target) === null || _b === void 0 ? void 0 : _b.result);
                                    multipartRequestBody = delimiter +
                                        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                                        JSON.stringify(metadata) +
                                        delimiter +
                                        "Content-Type: ".concat(contentType, "\r\n") +
                                        'Content-Transfer-Encoding: base64\r\n\r\n' +
                                        base64Data +
                                        closeDelim;
                                    return [4 /*yield*/, fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                                            method: 'POST',
                                            headers: {
                                                Authorization: "Bearer ".concat(token),
                                                'Content-Type': "multipart/related; boundary=".concat(boundary),
                                            },
                                            body: multipartRequestBody,
                                        })];
                                case 1:
                                    response = _c.sent();
                                    if (!!response.ok) return [3 /*break*/, 2];
                                    reject(new Error('Failed to upload file'));
                                    return [3 /*break*/, 4];
                                case 2:
                                    _a = resolve;
                                    return [4 /*yield*/, response.json()];
                                case 3:
                                    _a.apply(void 0, [_c.sent()]);
                                    _c.label = 4;
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); };
                    reader.onerror = function () { return reject(new Error('Failed to read file')); };
                    reader.readAsBinaryString(file);
                })];
        });
    });
}
function deleteDriveFile(token, fileId) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("https://www.googleapis.com/drive/v3/files/".concat(fileId), {
                        method: 'DELETE',
                        headers: { Authorization: "Bearer ".concat(token) },
                    })];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to delete file');
                    return [2 /*return*/, true];
            }
        });
    });
}
function shareDriveFile(token, fileId) {
    return __awaiter(this, void 0, void 0, function () {
        var permRes, file;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("https://www.googleapis.com/drive/v3/files/".concat(fileId, "/permissions"), {
                        method: 'POST',
                        headers: {
                            Authorization: "Bearer ".concat(token),
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
                    })];
                case 1:
                    permRes = _a.sent();
                    if (!permRes.ok)
                        throw new Error('Failed to set sharing permissions');
                    return [4 /*yield*/, getDriveFileDetails(token, fileId)];
                case 2:
                    file = _a.sent();
                    return [2 /*return*/, file.webViewLink || file.webContentLink || ''];
            }
        });
    });
}
function searchDriveFiles(token, query) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("https://www.googleapis.com/drive/v3/files?q=".concat(encodeURIComponent(query)), {
                        headers: { Authorization: "Bearer ".concat(token) },
                    })];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to search Drive files');
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, data.files || []];
            }
        });
    });
}
function listGmailMessages(token_1) {
    return __awaiter(this, arguments, void 0, function (token, maxResults) {
        var listRes, listData, messages, err_2;
        var _this = this;
        if (maxResults === void 0) { maxResults = 10; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=".concat(maxResults), {
                            headers: { Authorization: "Bearer ".concat(token) },
                        })];
                case 1:
                    listRes = _a.sent();
                    if (!listRes.ok)
                        throw new Error('Failed to fetch Gmail messages');
                    return [4 /*yield*/, listRes.json()];
                case 2:
                    listData = _a.sent();
                    if (!listData.messages)
                        return [2 /*return*/, []];
                    return [4 /*yield*/, Promise.all(listData.messages.map(function (msg) { return __awaiter(_this, void 0, void 0, function () {
                            var msgRes;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/".concat(msg.id, "?format=metadata&metadataHeaders=subject&metadataHeaders=from&metadataHeaders=date&metadataHeaders=snippet"), {
                                            headers: { Authorization: "Bearer ".concat(token) },
                                        })];
                                    case 1:
                                        msgRes = _a.sent();
                                        if (!msgRes.ok)
                                            return [2 /*return*/, null];
                                        return [4 /*yield*/, msgRes.json()];
                                    case 2: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); }))];
                case 3:
                    messages = _a.sent();
                    return [2 /*return*/, messages.filter(Boolean)];
                case 4:
                    err_2 = _a.sent();
                    return [2 /*return*/, []];
                case 5: return [2 /*return*/];
            }
        });
    });
}
