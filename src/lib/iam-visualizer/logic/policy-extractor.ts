import { nodeStore } from "../../../stores/nodes/nodes";
import { ResourceStates, ReferenceResource, Resource } from "../../../stores/nodes/preprocessor";
import type { Policy } from "../model/Policy";
import { PolicyStatement } from "../model/PolicyStatement";

export function extractPolicies(nodeId: string) {
    let nodeTableName = nodeStore.getters.getSelectedNodeTable();
    try {
        const policies = getPolicies(nodeId, nodeTableName);
        return policies;
    } catch (e) {
        if (typeof e === "string") {
            console.error(e.toUpperCase());
        } else if (e instanceof Error) {
            console.error(e.message);
        }
        return [];
    }
}

function getPolicies(nodeId: string, nodeTableName: string) {
    const splitedArn = nodeId.split(":");
    const nodeType = splitedArn[splitedArn.length - 1].split("/")[0];
    var policies: Policy[] = [];
    switch (nodeType) {
        case "user":
            userPolicies(nodeId);
            break;
        case "group":
            policies = policies.concat(getGroupPolicies(nodeId, nodeTableName));
            break;
        case "role":
            policies = policies.concat(getRolePolicies(nodeId, nodeTableName));
            break;
        default:
            throw Error(
                `No policy details could be extracted for node of type ${nodeType}`
            );
    }
    return policies;
}

function userPolicies(nodeId: string) { }

function getGroupPolicies(nodeId: string, nodeTableName: string) {
    const resources = nodeStore.getters.getNodesByResourceType(
        nodeTableName,
        "aws_iam_group_policy_attachment"
    );
    return resources
        .map(
            (resource) =>
                [
                    resource.address,
                    resource.dependencies,
                    resource.states.get(ResourceStates.CurrentState),
                ] as const
        )
        .filter(
            (tuple): tuple is [string, string[], Map<String, any>] =>
                !!tuple
        )
        .filter((tuple) => tuple[1] !== undefined)
        .map((tuple) => {
            const groupArn = tuple[1]
                .filter((dependency) => {
                    const splittedAddress = dependency.split(".");
                    return (
                        splittedAddress[splittedAddress.length - 2] ===
                        "aws_iam_group"
                    );
                })
                .map((dependency) => {
                    const node = nodeStore.getters.getNode(
                        nodeTableName,
                        dependency
                    );
                    if (node instanceof ReferenceResource) {
                        const referenceResource = node as ReferenceResource;
                        if (referenceResource.children === undefined) {
                            throw Error(
                                `No children are defined in the ReferenceResource ${node.address}`
                            );
                        } else {
                            const childrenAddresses =
                                referenceResource.children.filter(
                                    (dependency) => {
                                        const splittedAddress =
                                            dependency.split(".");
                                        return (
                                            splittedAddress[
                                            splittedAddress.length - 2
                                            ] === "aws_iam_role"
                                        );
                                    }
                                );
                            if (childrenAddresses.length !== 1) {
                                throw Error(
                                    `It is expected that ${referenceResource.address} only reference one child, but it referes to ${childrenAddresses.length}`
                                );
                            }
                            return nodeStore.getters.getNode(
                                nodeTableName,
                                childrenAddresses[0] as string
                            );
                        }
                    } else {
                        return node;
                    }
                })
                .filter((node) => node !== undefined)
                .map((node) => {
                    const resource = node as Resource;
                    const state = resource.states.get(
                        ResourceStates.CurrentState
                    );
                    var arn = undefined;
                    if (state !== undefined) {
                        arn = state.get("arn") as string;
                    }
                    return arn;
                });

            if (groupArn.length !== 1) {
                throw Error(
                    `The policy attachment ${tuple[0]} reference more than one role`
                );
            }

            var sanatizedGroupArn: string;
            if (
                groupArn[0] !== undefined &&
                typeof groupArn[0] === "string"
            ) {
                sanatizedGroupArn = groupArn[0] as string;
            } else {
                throw Error(
                    `The extracted group-arn "${groupArn[0]
                    }" is of type ${typeof groupArn[0]} instead of string`
                );
            }

            if (sanatizedGroupArn === nodeId) {
                const policies = tuple[1]
                    .filter((dependency) => {
                        const splittedAddress = dependency.split(".");
                        return (
                            splittedAddress[splittedAddress.length - 2] ===
                            "aws_iam_policy_document"
                        );
                    })
                    .map((dependency) =>
                        nodeStore.getters.getNode(nodeTableName, dependency)
                    )
                    .filter((node) => node instanceof Resource)
                    .map((node) => {
                        const resource = node as Resource;
                        const state = resource.states.get(
                            ResourceStates.CurrentState
                        );
                        if (state !== undefined) {
                            const json = state.get("json");
                            const parsedJsons = JSON.parse(json);
                            return PolicyStatement.fromJson(parsedJsons)
                                .policies;
                        }
                    })
                    .filter((policies): policies is Policy[] => !!policies)
                    .reduce((acc, elem) => {
                        for (let policy of elem) {
                            const hasOnlyAssumeActions =
                                policy.action.filter(
                                    (action) => action === "sts:AssumeRole"
                                ).length === policy.action.length;
                            // if (!hasOnlyAssumeActions) {
                            acc.push(policy);
                            // }
                        }
                        return acc;
                    }, []);

                return policies;
            }
            return undefined;
        })
        .filter((tuple): tuple is Policy[] => !!tuple)
        .reduce((acc, elem) => {
            return acc.concat(elem);
        }, []);
}
function getRolePolicies(nodeId: string, nodeTableName: string) {
    const resources = nodeStore.getters.getNodesByResourceType(
        nodeTableName,
        "aws_iam_role_policy_attachment"
    );

    return resources
        .map(
            (resource) =>
                [
                    resource.address,
                    resource.dependencies,
                    resource.states.get(ResourceStates.CurrentState),
                ] as const
        )
        .filter(
            (tuple): tuple is [string, string[], Map<String, any>] =>
                !!tuple
        )
        .filter((tuple) => tuple[1] !== undefined)
        .map((tuple) => {
            const roleArn = tuple[1]
                .filter((dependency) => {
                    const splittedAddress = dependency.split(".");
                    return (
                        splittedAddress[splittedAddress.length - 2] ===
                        "aws_iam_role"
                    );
                })
                .map((dependency) => {
                    const node = nodeStore.getters.getNode(
                        nodeTableName,
                        dependency
                    );
                    if (node instanceof ReferenceResource) {
                        const referenceResource = node as ReferenceResource;
                        if (referenceResource.children === undefined) {
                            throw Error(
                                `No children are defined in the ReferenceResource ${node.address}`
                            );
                        } else {
                            const childrenAddresses =
                                referenceResource.children.filter(
                                    (dependency) => {
                                        const splittedAddress =
                                            dependency.split(".");
                                        return (
                                            splittedAddress[
                                            splittedAddress.length - 2
                                            ] === "aws_iam_role"
                                        );
                                    }
                                );
                            if (childrenAddresses.length !== 1) {
                                throw Error(
                                    `It is expected that ${referenceResource.address} only reference one child, but it referes to ${childrenAddresses.length}`
                                );
                            }
                            return nodeStore.getters.getNode(
                                nodeTableName,
                                childrenAddresses[0] as string
                            );
                        }
                    } else {
                        return node;
                    }
                })
                .filter((node) => node !== undefined)
                .map((node) => {
                    const resource = node as Resource;
                    const state = resource.states.get(
                        ResourceStates.CurrentState
                    );
                    var arn = undefined;
                    if (state !== undefined) {
                        arn = state.get("arn") as string;
                    }
                    return arn;
                });

            if (roleArn.length !== 1) {
                throw Error(
                    `The policy attachment ${tuple[0]} reference more than one role`
                );
            }

            var sanatizedRoleArn: string;
            if (typeof roleArn[0] === "string") {
                sanatizedRoleArn = roleArn[0] as string;
            } else {
                throw Error(
                    `The extracted group-arn "${roleArn[0]
                    }" is of type ${typeof roleArn[0]} instead of string`
                );
            }

            if (sanatizedRoleArn === nodeId) {
                const policies = tuple[1]
                    .filter((dependency) => {
                        const splittedAddress = dependency.split(".");
                        return (
                            splittedAddress[splittedAddress.length - 2] ===
                            "aws_iam_policy_document"
                        );
                    })
                    .map((dependency) =>
                        nodeStore.getters.getNode(nodeTableName, dependency)
                    )
                    .filter((node) => node instanceof Resource)
                    .map((node) => {
                        const resource = node as Resource;
                        const state = resource.states.get(
                            ResourceStates.CurrentState
                        );
                        if (state !== undefined) {
                            const json = state.get("json");
                            const parsedJsons = JSON.parse(json);
                            return PolicyStatement.fromJson(parsedJsons)
                                .policies;
                        }
                    })
                    .filter((policies): policies is Policy[] => !!policies)
                    .reduce((acc, elem) => {
                        for (let policy of elem) {
                            const hasOnlyAssumeActions =
                                policy.action.filter(
                                    (action) => action === "sts:AssumeRole"
                                ).length === policy.action.length;
                            if (!hasOnlyAssumeActions) {
                                acc.push(policy);
                            }
                        }
                        return acc;
                    }, []);
                return policies;
            }
            return undefined;
        })
        .filter((policies): policies is Policy[] => !!policies)
        .reduce((acc, elem) => {
            return acc.concat(elem);
        }, []);
}