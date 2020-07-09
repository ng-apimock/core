export interface MockResponseThenClause {
    // mocks that are going to be changed
    mocks: MockResponseThenClauseMockSelection[ ];
    criteria?: MockResponseThenClauseCriteria;
}

export interface MockResponseThenClauseMockSelection {
    // name of the mock
    name?: string;
    // scenario
    scenario: string;
}

export interface MockResponseThenClauseCriteria {
    // number of times the current response should be returned before this clause will be effectuated.
    times?: number;
}
