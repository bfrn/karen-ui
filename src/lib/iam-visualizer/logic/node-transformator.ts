import { NodeTypes, Node, Module, Resource, ResourceStates, ReferenceResource, Provider } from "../../../stores/nodes/preprocessor"
import { nodeStore } from "../../../stores/nodes/nodes";
import { iconStore } from "../../../stores/icons/icons";
import { PolicyStatement } from "../model/PolicyStatement";
import type { Policy } from "../model/Policy";


var nodeTableName = ""
const edgeIdArnSeperator = "<=>"

function roles() {
    const resources = nodeStore.getters.getNodesByResourceType(nodeTableName, "aws_iam_role");
    return resources
        .map(resource => [resource.address, resource.states.get(ResourceStates.CurrentState)] as const)
        .filter((tuple): tuple is (readonly [
            string,
            Map<String, any>
        ]) => !!tuple)
        .filter((tuple) => tuple[1] !== undefined)
        .map((tuple) => {
            const currentState = tuple[1];
            const arnKey = "arn";
            const roleArn: string = currentState.get(arnKey);
            if (roleArn === undefined) {
                throw Error(`The resource ${tuple[0]} doesn't contain in it's ${ResourceStates.CurrentState} state the key \"${arnKey}\"""`);
            }
            const assumeRolePolicyKey = "assume_role_policy";
            const assumeRolePolicy = currentState.get(assumeRolePolicyKey);
            if (assumeRolePolicy === undefined) {
                throw Error(`The resource ${tuple[0]} doesn't contain in it's ${ResourceStates.CurrentState} state the key \"${assumeRolePolicyKey}\"""`);
            }
            const json = JSON.parse(assumeRolePolicy);
            const ret = PolicyStatement.fromJson(json)
                .policies
                .map(policy => policy.principals)
                .filter((principalMap): principalMap is Map<string, string[]> => !!principalMap)
                .map(principalMap => [roleArn, principalMap] as const);
            return ret;
        })
        .reduce((acc, elem) => {
            for (let tuple of elem) {
                const roleArn = tuple[0];
                const principalMap = tuple[1];
                for (let principals of principalMap.values()) {
                    for (let principal of principals) {
                        const key = `${principal}`;
                        if (acc.has(key) === true) {
                            acc.get(key)?.add(roleArn);
                        }
                        else {
                            const principalList: Set<string> = new Set([roleArn]);
                            acc.set(key, principalList);
                        }
                    }
                }
            }
            return acc;
        }, new Map<string, Set<string>>());
}

function userGroupRelations() {
    const resources = nodeStore.getters.getNodesByResourceType(nodeTableName, "aws_iam_group_membership")
        .concat(nodeStore.getters.getNodesByResourceType(nodeTableName, "aws_iam_user_group_membership"));
    return resources
        .map(resource => [resource.address, resource.dependencies, resource.states.get(ResourceStates.CurrentState)] as const)
        .filter((tuple): tuple is [
            string,
            string[],
            Map<String, any>
        ] => !!tuple)
        .map((tuple) => {
            const groupArn = tuple[1]
                .filter(dependency => {
                    const splittedAddress = dependency.split(".");
                    return splittedAddress[splittedAddress.length - 2] === "aws_iam_group";
                })
                .map(dependency => nodeStore.getters.getNode(nodeTableName, dependency))
                .filter((resource): resource is Resource => !!resource)
                .map(resource => resource.states.get(ResourceStates.CurrentState))
                .filter((state): state is Map<String, any> => !!state)
                .map(state => state.get("arn"))
                .filter((arn): arn is string => !!arn);
            if (groupArn.length !== 1) {
                throw Error(`The resource ${tuple[0]} reference more than one group`);
            }
            const users = tuple[1]
                .filter(dependency => {
                    const splittedAddress = dependency.split(".");
                    return splittedAddress[splittedAddress.length - 2] === "aws_iam_user";
                })
                .map(dependency => nodeStore.getters.getNode(nodeTableName, dependency))
                .filter((resource): resource is Resource => !!resource)
                .map(resource => resource.states.get(ResourceStates.CurrentState))
                .filter((state): state is Map<String, any> => !!state)
                .map(state => state.get("arn"))
                .filter((arn): arn is string => !!arn);
            return [groupArn[0], users] as const;
        })
        .reduce((acc, elem) => {
            const groupArn = elem[0];
            const userArns = elem[1];
            for (let userArn of userArns) {
                if (acc.has(userArn)) {
                    acc.get(userArn)?.add(groupArn);
                }
                else {
                    acc.set(userArn, new Set([groupArn]));
                }
            }
            return acc;
        }, new Map<string, Set<string>>());
}
function groupRoleRelations() {
    const resources = nodeStore.getters.getNodesByResourceType(nodeTableName, "aws_iam_group_policy");
    return resources
        .map(resource => [resource.address, resource.dependencies, resource.states.get(ResourceStates.CurrentState)] as const)
        .filter((tuple): tuple is [
            string,
            string[],
            Map<String, any>
        ] => !!tuple)
        .map((tuple) => {
            const groupArn = tuple[1]
                .filter(dependency => {
                    const splittedAddress = dependency.split(".");
                    return splittedAddress[splittedAddress.length - 2] === "aws_iam_group";
                })
                .map(dependency => nodeStore.getters.getNode(nodeTableName, dependency))
                .filter((resource): resource is Resource => !!resource)
                .map(resource => resource.states.get(ResourceStates.CurrentState))
                .filter((state): state is Map<String, any> => !!state)
                .map(state => state.get("arn"))
                .filter((arn): arn is string => !!arn);
            if (groupArn.length !== 1) {
                throw Error(`The resource ${tuple[0]} reference more than one group`);
            }
            const policyString = tuple[2].get("policy");
            if (policyString === undefined) {
                throw new Error(`The ${ResourceStates.CurrentState} of the ${tuple[0]} doesn't contain the field \"policy\"`);
            }
            const policyJson = JSON.parse(policyString);
            const roleArns = PolicyStatement.fromJson(policyJson)
                .policies
                .map(policy => policy.resources)
                .filter((resources): resources is string[] => !!resources)
                .reduce((acc, elem) => acc.concat(elem), []);
            return [groupArn[0], roleArns] as const;
        })
        .reduce((acc, elem) => {
            const key = elem[0];
            const parentArn = elem[0];
            const roleArns = elem[1];
            if (acc.has(key)) {
                for (let arn of roleArns) {
                    acc.get(parentArn)?.add(arn);
                }
            }
            else {
                const children = new Set<string>();
                for (let arn of roleArns) {
                    children.add(arn);
                }
                acc.set(parentArn, children);
            }
            return acc;
        }, new Map<string, Set<string>>());
}
function getGroupPolicyAttachments() {
    const resources = nodeStore.getters.getNodesByResourceType(nodeTableName, "aws_iam_group_policy_attachment");
    return resources
        .map(resource => [resource.address, resource.dependencies, resource.states.get(ResourceStates.CurrentState)] as const)
        .filter((tuple): tuple is [
            string,
            string[],
            Map<String, any>
        ] => !!tuple)
        .filter(tuple => tuple[1] !== undefined)
        .map((tuple) => {
            const policies = tuple[1]
                .filter(dependency => {
                    const splittedAddress = dependency.split(".");
                    return splittedAddress[splittedAddress.length - 2] === "aws_iam_policy_document";
                })
                .map(dependency => nodeStore.getters.getNode(nodeTableName, dependency))
                .filter(node => node instanceof Resource)
                .map(node => {
                    const resource = node as Resource;
                    const state = resource.states.get(ResourceStates.CurrentState);
                    if (state !== undefined) {
                        const json = state.get("json");
                        const parsedJsons = JSON.parse(json);
                        return PolicyStatement.fromJson(parsedJsons).policies;
                    }
                })
                .filter((policies): policies is Policy[] => !!policies)
                .reduce((acc, elem) => {
                    for (let policy of elem) {
                        const hasAssumePrincipalAction = (policy.action.filter(action => action === "sts:AssumeRole").length) > 0;
                        if (hasAssumePrincipalAction) {
                            acc.push(policy);
                        }
                    }
                    return acc;
                }, []);
            const groupArn = tuple[1]
                .filter(dependency => {
                    const splittedAddress = dependency.split(".");
                    return splittedAddress[splittedAddress.length - 2] === "aws_iam_group";
                })
                .map(dependency => {
                    const node = nodeStore.getters.getNode(nodeTableName, dependency);
                    if (node instanceof ReferenceResource) {
                        const referenceResource = node as ReferenceResource;
                        if (referenceResource.children === undefined) {
                            throw Error(`No children are defined in the ReferenceResource ${node.address}`);
                        }
                        else {
                            const childrenAddresses = referenceResource.children
                                .filter(dependency => {
                                    const splittedAddress = dependency.split(".");
                                    return splittedAddress[splittedAddress.length - 2] === "aws_iam_role";
                                });
                            if (childrenAddresses.length !== 1) {
                                throw Error(`It is expected that ${referenceResource.address} only reference one child, but it referes to ${childrenAddresses.length}`);
                            }
                            return nodeStore.getters.getNode(nodeTableName, childrenAddresses[0] as string);
                        }
                    }
                    else {
                        return node;
                    }
                })
                .filter(node => node !== undefined)
                .map(node => {
                    const resource = node as Resource;
                    const state = resource.states.get(ResourceStates.CurrentState);
                    var arn = undefined;
                    if (state !== undefined) {
                        arn = state.get("arn") as string;
                    }
                    return arn;
                });
            if (groupArn.length !== 1) {
                throw Error(`The policy attachment ${tuple[0]} reference more than one role`);
            }
            return [groupArn[0], policies] as const;
        })
        .filter((tuple): tuple is [
            string,
            Policy[]
        ] => !!tuple)
        .reduce((acc, elem) => {
            const arn = elem[0];
            const policies = elem[1];
            for (let policy of policies) {
                if ((policy.resources !== undefined) && (policy.principals === undefined)) {
                    if (!acc.has(arn)) {
                        acc.set(arn, new Set());
                    }
                    for (let resource of policy.resources) {
                        acc.get(arn)?.add(resource);
                    }
                }
                else if ((policy.resources === undefined) && (policy.principals !== undefined)) {
                    for (let parentArns of policy.principals.values()) {
                        for (let parentArn of parentArns) {
                            if (!acc.has(parentArn)) {
                                acc.set(parentArn, new Set([arn]));
                            }
                            else {
                                const children = acc.get(parentArn)?.add(arn) as Set<string>;
                                acc.set(parentArn, children);
                            }
                        }
                    }
                }
                else {
                    throw Error(`Either the resources field should be undefined and the principals field defined
            or the resources field should be defined and the principals field undefiend, 
            but that's not the case for the given policy ${policy}`);
                }
            }
            return acc;
        }, new Map<string, Set<string>>());
}

function getRolePolicyAttachments() {
    const resources = nodeStore.getters.getNodesByResourceType(nodeTableName, "aws_iam_role_policy_attachment");
    return resources
        .map(resource => [resource.address, resource.dependencies, resource.states.get(ResourceStates.CurrentState)] as const)
        .filter((tuple): tuple is [
            string,
            string[],
            Map<String, any>
        ] => !!tuple)
        .filter(tuple => tuple[1] !== undefined)
        .map((tuple) => {
            const policies = tuple[1]
                .filter(dependency => {
                    const splittedAddress = dependency.split(".");
                    return splittedAddress[splittedAddress.length - 2] === "aws_iam_policy_document";
                })
                .map(dependency => nodeStore.getters.getNode(nodeTableName, dependency))
                .filter(node => node instanceof Resource)
                .map(node => {
                    const resource = node as Resource;
                    const state = resource.states.get(ResourceStates.CurrentState);
                    if (state !== undefined) {
                        const json = state.get("json");
                        const parsedJsons = JSON.parse(json);
                        return PolicyStatement.fromJson(parsedJsons).policies;
                    }
                })
                .filter((policies): policies is Policy[] => !!policies)
                .reduce((acc, elem) => {
                    for (let policy of elem) {
                        const hasAssumePrincipalAction = (policy.action.filter(action => action === "sts:AssumeRole").length) > 0;
                        if (hasAssumePrincipalAction) {
                            acc.push(policy);
                        }
                    }
                    return acc;
                }, []);
            const roleArn = tuple[1]
                .filter(dependency => {
                    const splittedAddress = dependency.split(".");
                    return splittedAddress[splittedAddress.length - 2] === "aws_iam_role";
                })
                .map(dependency => {
                    const node = nodeStore.getters.getNode(nodeTableName, dependency);
                    if (node instanceof ReferenceResource) {
                        const referenceResource = node as ReferenceResource;
                        if (referenceResource.children === undefined) {
                            throw Error(`No children are defined in the ReferenceResource ${node.address}`);
                        }
                        else {
                            const childrenAddresses = referenceResource.children
                                .filter(dependency => {
                                    const splittedAddress = dependency.split(".");
                                    return splittedAddress[splittedAddress.length - 2] === "aws_iam_role";
                                });
                            if (childrenAddresses.length !== 1) {
                                throw Error(`It is expected that ${referenceResource.address} only reference one child, but it referes to ${childrenAddresses.length}`);
                            }
                            return nodeStore.getters.getNode(nodeTableName, childrenAddresses[0] as string);
                        }
                    }
                    else {
                        return node;
                    }
                })
                .filter(node => node !== undefined)
                .map(node => {
                    const resource = node as Resource;
                    const state = resource.states.get(ResourceStates.CurrentState);
                    var arn = undefined;
                    if (state !== undefined) {
                        arn = state.get("arn") as string;
                    }
                    return arn;
                });
            if (roleArn.length !== 1) {
                throw Error(`The policy attachment ${tuple[0]} reference more than one role`);
            }
            return [roleArn[0], policies] as const;
        })
        .filter((tuple): tuple is [
            string,
            Policy[]
        ] => !!tuple)
        .reduce((acc, elem) => {
            const arn = elem[0];
            const policies = elem[1];
            for (let policy of policies) {
                if ((policy.resources !== undefined) && (policy.principals === undefined)) {
                    if (!acc.has(arn)) {
                        acc.set(arn, new Set());
                    }
                    for (let resource of policy.resources) {
                        acc.get(arn)?.add(resource);
                    }
                }
                else if ((policy.resources === undefined) && (policy.principals !== undefined)) {
                    for (let parentArns of policy.principals.values()) {
                        for (let parentArn of parentArns) {
                            if (!acc.has(parentArn)) {
                                acc.set(parentArn, new Set([arn]));
                            }
                            else {
                                const children = acc.get(parentArn)?.add(arn) as Set<string>;
                                acc.set(parentArn, children);
                            }
                        }
                    }
                }
                else {
                    throw Error(`Either the resources field should be undefined and the principals field defined
            or the resources field should be defined and the principals field undefiend, 
            but that's not the case for the given policy ${policy}`);
                }
            }
            return acc;
        }, new Map<string, Set<string>>());
}

export function getPrincipalRelations() {
    nodeTableName = nodeStore.getters.getSelectedNodeTable()

    const principalRelations = [
        roles(),
        userGroupRelations(),
        groupRoleRelations(),
        getRolePolicyAttachments(),
        getGroupPolicyAttachments(),
    ];
    const mergedPrincipalRelations = new Map<string, Set<string>>();
    for (let principalRelation of principalRelations) {
        for (let [principalArn, children] of principalRelation) {
            if (mergedPrincipalRelations.has(principalArn)) {
                for (let child of children) {
                    mergedPrincipalRelations.get(principalArn)?.add(child);
                }
            }
            else {
                mergedPrincipalRelations.set(principalArn, children);
            }
        }
    }
    return mergedPrincipalRelations;
}

export function getPrincipalGraph(principalRelations: Map<string, Set<string>>): any[] {
    nodeTableName = nodeStore.getters.getSelectedNodeTable()

    var cytoscapeData: any[] = [];
    for (let [principalArn, children] of principalRelations) {
        cytoscapeData.push({
            group: "nodes",
            data: { id: principalArn, name: principalArn.replace("arn:aws:iam::", "") },
        });
        for (let child of children) {
            cytoscapeData.push({
                group: "nodes",
                data: { id: child, name: child.replace("arn:aws:iam::", "") },
            });
            cytoscapeData.push({
                group: "edges",
                data: { id: `${principalArn}${edgeIdArnSeperator}${child}`, source: principalArn, target: child },
            });
        }
    }
    return cytoscapeData;
}

export function getNodeIcon(nodeId: string): string | undefined {
    nodeTableName = nodeStore.getters.getSelectedNodeTable()

    var icon: string | undefined = undefined;
    if (nodeId.startsWith("arn:aws:iam::")) {
        const splitedNodeId = nodeId.split(":");
        const nodeType = splitedNodeId[splitedNodeId.length - 1].split("/")[0];
        icon = iconStore.getters.getIcon(nodeType);
    }
    else if (nodeId.endsWith(".amazonaws.com")) {
        const nodeType = nodeId.split(".")[0];
        icon = iconStore.getters.getIcon(nodeType);
    }
    else {
        icon = iconStore.getters.getIcon("resource");
    }
    if (icon === undefined) {
        icon = iconStore.getters.getIcon("resource");
    }
    return icon;
}