import t from "tap";
import { CloseAllConnections } from "../../../../../test-utils/close-connections";
import { agta } from "../../../../../test-utils/misc";
import { MockJSONFetch } from "../../../../../test-utils/mock-fetch";
import ResetDBState from "../../../../../test-utils/reset-db-state";
import CreateLogCtx from "../../../../logger/logger";
import { ParseArcIIDX } from "./parser";

const logger = CreateLogCtx(__filename);

t.test("#ParseArcIIDX", (t) => {
    t.beforeEach(ResetDBState);

    t.test("Should iterate over the API.", async (t) => {
        const mockArcAPI = MockJSONFetch({
            "https://arc.example.com/api/v1/iidx/27/player_bests?profile_id=profile": {
                _links: {
                    _next:
                        "https://arc.example.com/api/v1/iidx/27/player_bests?profile_id=profile&page=2",
                },
                _items: [1, 2, 3],
            },
            "https://arc.example.com/api/v1/iidx/27/player_bests?profile_id=profile&page=2": {
                _links: {
                    _next: null,
                },
                _items: [4, 5, 6],
            },
        });

        const res = await ParseArcIIDX("profile", logger, mockArcAPI);

        t.equal(res.game, "iidx");
        t.strictSame(res.context, {});

        const iter = await agta(res.iterable);

        t.strictSame(iter, [1, 2, 3, 4, 5, 6]);

        t.end();
    });

    t.end();
});

t.teardown(CloseAllConnections);
