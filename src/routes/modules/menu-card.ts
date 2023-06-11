
export class MenuCard {
    route: string;
    title: string;
    description: string;

    constructor(route: string, title: string, description: string) {
        this.route = route;
        this.title = title;
        this.description = description;
    }
}