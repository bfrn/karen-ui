import { Policy } from "./Policy"

export class PolicyStatement {
    private static readonly STATEMENT_JSON_KEY = "Statement"
    private static readonly VERSION_JSON_KEY = "Version"

    policies: Policy[]
    version: string

    constructor(
        policies: Policy[],
        version: string,
    ) {
        this.policies = policies
        this.version = version
    }
    static fromJson(json: any) {
        const policies: Policy[] = []
        for (let idx in json[PolicyStatement.STATEMENT_JSON_KEY]) {
            policies.push(Policy.fromJson(json[PolicyStatement.STATEMENT_JSON_KEY][idx]))
        }
        const version = json[PolicyStatement.VERSION_JSON_KEY]
        return new PolicyStatement(policies, version)
    }
}

