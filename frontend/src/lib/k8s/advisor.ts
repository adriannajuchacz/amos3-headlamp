import { apiFactoryWithNamespace } from './apiProxy'
import { KubeObjectInterface, makeKubeObject } from './cluster'

export interface KubeAdvisor extends KubeObjectInterface {
    spec: {
        clusterIP: string;
    }

}

class Advisor extends makeKubeObject<KubeAdvisor>('advisor'){
    static apiEndpoint = apiFactoryWithNamespace('', 'v1', 'advisor')

    get spec() {
        return this.jsonData!.spec;
    }
}

export default Advisor;
