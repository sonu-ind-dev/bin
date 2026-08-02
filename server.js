import app from "./src/app.js";
import config from "./src/config/config.js";

app.listen(config.APP_PORT, () => console.log(`Server Running @ PORT:${config.APP_PORT}`));
