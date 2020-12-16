import React from 'react';
import Advisor from '../../lib/k8s/advisor';
import { useFilterFunc } from '../../lib/util';
import Link from '../common/Link';
import { SectionBox } from '../common/SectionBox';
import SectionFilterHeader from '../common/SectionFilterHeader';
import SimpleTable from '../common/SimpleTable';
import Namespace from '../../lib/k8s/namespace';
import { StatusLabel } from '../common/Label';


export default function AdvisorList() {
    const [namespaces, error] = Namespace.useList();
    const filterFunc = useFilterFunc();

    function makeStatusLabel(namespace: Namespace) {
        const status = namespace.status.phase;
        return (
            <StatusLabel status={status === 'Active' ? 'success' : 'error'}>
                {status}
            </StatusLabel>
        );
    }

    return (
        <SectionBox

            title={
                <SectionFilterHeader
                    title="Network Policy Advisor"
                    noNamespaceFilter
                    headerStyle="main"
                />
            }
        >
            <SimpleTable
                rowsPerPage={[100]}
                filterFunction={filterFunc}
                errorMessage={Namespace.getErrorMessage(error)}
                columns={[
                    {
                        label: 'Name',
                        getter: (namespace) => namespace.getName(),
                        sort: (n1: Namespace, n2: Namespace) => {
                            if (n1.metadata.name < n2.metadata.name) {
                                return -1;
                            } else if (n1.metadata.name > n2.metadata.name) {
                                return 1;
                            }
                            return 0;
                        }
                    },
                ]}
                data={namespaces}
                defaultSortingColumn={3}
            />
        </SectionBox>
    )
}