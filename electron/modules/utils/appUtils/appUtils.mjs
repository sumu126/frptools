import { app } from 'electron';

let quitFlag = false;
/**
 * 退出应用程序
 */
function quitApp() {
    quitFlag = true;
    app.quit();
}

function getQuitFlag() {
    return quitFlag;
}

function updateToRestart(){
    quitFlag = true;
}

export {
    quitApp,
    getQuitFlag,
    updateToRestart
};