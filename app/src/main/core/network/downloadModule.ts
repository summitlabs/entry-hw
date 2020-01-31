import { net } from 'electron';
import path from 'path';
import fs from 'fs';
import NetworkZipHandlerStream from '../networkZipHandleStream';

type IDownloadModuleParams = {
    moduleFile: string;
    version: string;
    moduleName: string;
}

const downloadModuleFunction = ({ moduleFile, version, moduleName }: IDownloadModuleParams) =>
    new Promise((resolve, reject) => {
        if (!moduleName) {
            reject();
            return;
        }

        const { baseUrl, baseResource } = global.sharedObject;

        //TODO 개발간 임시
        const request = net.request(`${baseUrl}${baseResource}/${moduleName}/${version}/${moduleFile}`);
        request.on('response', (response) => {
            response.on('error', reject);
            if (response.statusCode === 200) {
                const moduleDirPath = path.resolve('app', 'modules');
                const zipStream = new NetworkZipHandlerStream(moduleDirPath);
                zipStream.on('done', () => {
                    fs.readFile(
                        path.join(moduleDirPath, `${moduleName}.json`),
                        (err, data) => {
                            if (err) {
                                reject(err);
                            }
                            resolve(JSON.parse(data.toString('utf8')));
                        });
                });

                // @ts-ignore
                response.pipe(zipStream);
                response.on('end', () => {
                    // nothing to do
                });
            } else {
                console.error('module request get not ok status');
                reject();
            }
        });
        request.end();
    });

export default downloadModuleFunction;
