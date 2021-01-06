import React from 'react';
import Advisor from '../../lib/k8s/advisor';
import { useFilterFunc } from '../../lib/util';
import { SectionBox } from '../common/SectionBox';
import SectionFilterHeader from '../common/SectionFilterHeader';
import Button from '@material-ui/core/Button';
import SimpleTable from '../common/SimpleTable';
import Namespace from '../../lib/k8s/namespace';
import { StatusLabel } from '../common/Label';
import { Tooltip } from '@material-ui/core';
import { LogViewer, LogViewerProps } from '../common/LogViewer';
import { makeStyles } from '@material-ui/core/styles';

import _ from 'lodash';

const useStyle = makeStyles({
    containerFormControl: {
        minWidth: '11rem',
    }
});

interface AdvisorLogViewerProps extends Omit<LogViewerProps, 'logs'> {
    namespaceTitle: String;
}

function AdvisorLogViewer(props: AdvisorLogViewerProps) {
    const classes = useStyle();
    const { onClose, open, namespaceTitle, ...other } = props;
    const [lines, setLines] = React.useState<number>(100);
    const [logs, setLogs] = React.useState<string[]>([]);

    function handleLinesChange(event: any) {
        setLines(event.target.value);
    }

    return (
        <LogViewer
            title={`Acquiring network policies for namespaces: ${namespaceTitle}`}
            open={open}
            onClose={onClose}
            logs={logs}
        />
    );
}


export default function AdvisorList() {
    const [advisors, error] = Namespace.useList();
    const filterFunc = useFilterFunc();
    const [showLogs, setShowLogs] = React.useState(false);
    let [selctedNamespace, setSelctedNamespace] = React.useState("");
    item: Namespace;

    function makeStatusLabel(namespace: Advisor) {
        const status = namespace.status.phase;
        return (
            <StatusLabel status={status === 'Active' ? 'success' : 'error'}>
                {status}
            </StatusLabel>
        );
    }
    function startRecording(namespace: string) {
        setShowLogs(true)
        setSelctedNamespace(namespace)
    }

    function closeAdvisorLogViewer() {
        setShowLogs(false)
        setSelctedNamespace("")
    }

    return (
        <SectionBox
            title={
                <SectionFilterHeader
                    title="Network Policy Advisor"
                //noNamespaceFilter
                //headerStyle="main"
                />
            }
        >
            <SimpleTable
                rowsPerPage={[100]}
                filterFunction={filterFunc}
                errorMessage={Advisor.getErrorMessage(error)}
                columns={[
                    {
                        label: 'Name',
                        getter: (advisor) => advisor.getName(),
                        sort: (n1: Advisor, n2: Advisor) => {
                            if (n1.metadata.name < n2.metadata.name) {
                                return -1;
                            } else if (n1.metadata.name > n2.metadata.name) {
                                return 1;
                            }
                            return 0;
                        }
                    },
                    {
                        label: 'Recording',
                        getter: (advisor) =>
                            <div>
                                <Tooltip title="By clicking this button you will start recording this particular namespace">
                                    <Button
                                        onClick={() => startRecording(advisor.getName())}
                                        variant="outlined"
                                        style={{ textTransform: 'none' }}>
                                        Start Recording
                                    </Button>
                                </Tooltip>
                            </div>
                        ,
                    },
                ]}
                data={advisors}
                defaultSortingColumn={3}
            />
            <AdvisorLogViewer
                key="logs"
                open={showLogs}
                onClose={() => closeAdvisorLogViewer()}
                namespaceTitle={selctedNamespace}
            />
        </SectionBox>
    )
}