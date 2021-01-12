import React from 'react';
import Advisor from '../../lib/k8s/advisor';
import { useFilterFunc } from '../../lib/util';
import { SectionBox } from '../common/SectionBox';
import SectionFilterHeader from '../common/SectionFilterHeader';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import SimpleTable from '../common/SimpleTable';
import Namespace from '../../lib/k8s/namespace';
import { StatusLabel } from '../common/Label';
import { Checkbox, TextField, Tooltip } from '@material-ui/core';
import { LogViewer, LogViewerProps } from '../common/LogViewer';
import { makeStyles } from '@material-ui/core/styles';
import Timer from 'react-compound-timer'
import Select from 'react-select';

import Autocomplete from '@material-ui/lab/Autocomplete';
import { useDispatch } from 'react-redux';
import { useTypedSelector } from '../../redux/reducers/reducers';
import checkboxBlankOutline from '@iconify/icons-mdi/checkbox-blank-outline';
import checkBoxOutline from '@iconify/icons-mdi/check-box-outline';
import { useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import _, { filter } from 'lodash';
import { setNamespaceFilter } from '../../redux/actions/actions';
import Icon from '@iconify/react';

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


    return (
        <LogViewer
            title={`Acquiring network policies for namespaces: ${namespaceTitle}`}
            open={open}
            onClose={onClose}
            logs={logs}
        >
            <Timer>
                {({ stop }: { stop: any }) => (
                    <React.Fragment>
                        <Tooltip title={`By clicking this button you will stop recording this particular namespace`}>
                            <Button
                                onClick={stop}
                                variant="outlined"
                                style={{ textTransform: 'none' }}>
                                Stop Recording
                                </Button>
                        </Tooltip>
                        <Box component="span" m={1}>
                            <div>
                                <p>runs:
                                    <Timer.Hours formatValue={value => `${value}:`} />
                                    <Timer.Minutes formatValue={value => `${value}:`} />
                                    <Timer.Seconds formatValue={value => `${value} s`} />
                                </p>
                            </div>
                        </Box>
                    </React.Fragment>
                )}
            </Timer>
        </LogViewer >
    );
}


export default function AdvisorList() {
    const [advisors, error] = Namespace.useList();
    const filterFunc = useFilterFunc();
    const [showLogs, setShowLogs] = React.useState(false);
    let [selctedNamespace, setSelctedNamespace] = React.useState("");

    const theme = useTheme();
    const filter = useTypedSelector(state => state.filter)
    const [namespaces, setNamespaces] = React.useState<Namespace[]>([]);

    Namespace.useApiList(setNamespaces);

    const dispatch = useDispatch();

    function renderTags(tags: string[]) {
        let jointTags = tags.join(', ');
        if (jointTags.length > 15) {
          jointTags = jointTags.slice(0, 15) + '…';
        }
    
        return (
          <Typography>{jointTags}</Typography>
        );
    }

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
                "Network Policy Advisor"
                //<SectionFilterHeader
                    // title="Network Policy Advisor"
                ///>
            }
        >
            <p>Choose the namespaces and start recording to get network policy advices.</p>
            <Autocomplete
                multiple
                id="namespaces-filter"
                autoComplete
                options={namespaces.map(namespace => namespace.metadata.name)}
                defaultValue={[]}
                onChange={(event, newValue) => {
                    dispatch(setNamespaceFilter(newValue));
                    return [newValue];
                }}

                value={[...filter.namespaces.values()].reverse()}
                renderOption={(option, { selected }) => (
                    <React.Fragment>
                        <Checkbox
                            icon={<Icon icon={checkboxBlankOutline} />}
                            checkedIcon={<Icon icon={checkBoxOutline} />}
                            style={{
                                color: selected ? theme.palette.primary.main : theme.palette.text.primary }}
                            checked={selected}
                        />
                        {option}
                    </React.Fragment>
                )}
                renderTags={renderTags}
                renderInput={params => (
                    <Box width="15rem">
                        <TextField
                            {...params}
                            variant="standard"
                            label="Namespaces"
                            fullWidth
                            InputLabelProps={{shrink: true}}
                            style={{marginTop: 0}}
                            placeholder={[...filter.namespaces.values()].length > 0 ? '' : 'Filter'}
                        />
                    </Box>
                )}
            />
            <div>
                <Tooltip title="By clicking this button you will start recording this particular namespace">
                    <Button
                        //onClick={() => startRecording()}
                        variant="outlined"
                        style={{ textTransform: 'none' }}>
                        Start Recording
                    </Button>
                </Tooltip>
            </div>
            {/* <SimpleTable
                rowsPerPage={[100]}
                filterFunction={filterFunc}
                errorMessage={Advisor.getErrorMessage(error)}
                columns={[
                    {
                        label: 'Name',
                        getter: (advisor) => 
                        advisor.getName(),
                        // <div>
                        //     <input
                        //         value={advisor.getName()} 
                        //         type="checkbox" 
                        //         checked={state.isGoing} 
                        //         onChange={handleClick}
                        //     />
                        //     {advisor.getName()}
                        // </div>,
                        sort: (n1: Advisor, n2: Advisor) => {
                            if (n1.metadata.name < n2.metadata.name) {
                                return -1;
                            } else if (n1.metadata.name > n2.metadata.name) {
                                return 1;
                            }
                            return 0;
                        }
                    },
                    // {
                    //     label: 'Recording',
                    //     getter: (advisor) =>
                    //         <div>
                    //             Test:
                    //             <input
                    //                 value={advisor.getName()} 
                    //                 type="checkbox" 
                    //                 checked={state.isGoing} 
                    //                 //onChange={}
                    //             />
                    //         </div>
                    //         // <div>
                    //         //     <Tooltip title="By clicking this button you will start recording this particular namespace">
                    //         //         <Button
                    //         //             onClick={() => startRecording(advisor.getName())}
                    //         //             variant="outlined"
                    //         //             style={{ textTransform: 'none' }}>
                    //         //             Start Recording
                    //         //         </Button>
                    //         //     </Tooltip>
                    //         // </div>
                    //     ,
                    // },
                ]}
                data={advisors}
                defaultSortingColumn={3}
            /> */}
            <AdvisorLogViewer
                key="logs"
                open={showLogs}
                onClose={() => closeAdvisorLogViewer()}
                namespaceTitle={selctedNamespace}
            />
        </SectionBox>
    )
}