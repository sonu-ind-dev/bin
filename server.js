import app from "./src/app.js";
import config from "./src/config/config.js";
import { initializeMysqlModels } from "./src/db/mysql/index.js";

await initializeMysqlModels();
app.listen(config.APP_PORT, () => console.log(`SERVER: Server Running @PORT:${config.APP_PORT}`));
