export class Policy {
    private static readonly ACTION_JSON_KEY = "Action"
    private static readonly EFFECT_JSON_KEY = "Effect"
    private static readonly RESOURCE_JSON_KEY = "Resource"
    private static readonly PRINCIPAL_JSON_KEY = "Principal"

    action: string[]
    effect: string
    principals: Map<string, string[]> | undefined
    resources: string[] | undefined

    constructor(
        action: string[],
        effect: string,
        resource: string[] | undefined,
        principals: Map<string, string[]> | undefined,
    ) {
        this.action = action
        this.effect = effect
        this.resources = resource
        this.principals = principals
    }

    static fromJson(json: any): Policy {
        const action = (json[this.ACTION_JSON_KEY] instanceof Array ?
            json[Policy.ACTION_JSON_KEY] : [json[Policy.ACTION_JSON_KEY]])
        const effect = json[Policy.EFFECT_JSON_KEY]

        var resources = undefined
        if (json[Policy.RESOURCE_JSON_KEY] !== undefined) {
            resources = (json[Policy.RESOURCE_JSON_KEY] instanceof Array ?
                json[Policy.RESOURCE_JSON_KEY] : [json[Policy.RESOURCE_JSON_KEY]])
        }

        const unparsedPrincipal = json[Policy.PRINCIPAL_JSON_KEY]
        var principals = undefined
        if (unparsedPrincipal !== undefined) {
            principals = Object.keys(unparsedPrincipal)
                .map(principalType => {
                    const prinicipalJson = unparsedPrincipal[principalType]
                    const principals: string[] = prinicipalJson instanceof Array ? (prinicipalJson as string[]) : [(prinicipalJson as string)]
                    return [principalType, principals] as const
                })
                .reduce<Map<string, string[]>>((acc, elem) => {
                    acc.set(elem[0], elem[1])
                    return acc
                }, new Map<string, string[]>())
        }

        return new Policy(action, effect, resources, principals)
    }
}