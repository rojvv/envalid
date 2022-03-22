# envalid

This is a modified version of the original
[envalid](https://github.com/af/envalid) by [af](https://github.com/af) which
runs on Deno.

## Example usage

```ts
import { bool, cleanEnv, num, str } from "https://deno.land/x/envalid/mod.ts";

const env = cleanEnv(Deno.env.toObject(), {
  APP_ID: num(),
  TEXT: str(),
  YES: bool(),
});
```

For more information see the original repository,
[af/envalid](https://github.com/af/envalid). Note that some features are missing
here currently, for example browser support.
