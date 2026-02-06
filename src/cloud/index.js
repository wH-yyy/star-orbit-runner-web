import cloudbase from "@cloudbase/js-sdk";

const app = cloudbase.init({
    env: "cloud1-5gqrj5sn7b8043df",
});

// 关键：Web 端需要 auth 才有 credentials
const auth = app.auth({ persistence: "local" });

export async function ensureCloudLogin() {
    const state = await auth.getLoginState();
    if (!state) {
        await auth.signInAnonymously();
        console.log("CloudBase anonymous login success");
    }
}

export const callFunction = app.callFunction.bind(app);
