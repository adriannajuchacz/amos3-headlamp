import { apiFactory } from './apiProxy'
import { KubeObjectInterface, makeKubeObject } from './cluster'

export interface KubeAdvisor extends KubeObjectInterface {
    status: {
        phase: string;
    };
}

class Advisor extends makeKubeObject<KubeAdvisor>('advisor'){
    static apiEndpoint = apiFactory('', 'v1', 'advisors');

    get status() {
        return this.jsonData!.status;
    }
}

export default Advisor;
