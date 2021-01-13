package networkPolicy

import (
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"strings"
	"sync"
//	"bufio"
)

// var (
// 	running bool = false
// )
func Report (namespace string) {
	log.Println("####### Sending a Network Policy Report for:", namespace)
}

func Start (namespace string) {
	log.Println("####### Starting the Network Policy for:", namespace)
}

func Stop (namespace string) {
	log.Println("####### Stoping the Network Policy for:", namespace)
}


func copyAndCapture(w io.Writer, r io.Reader) ([]byte, error) {
	var out []byte
	buf := make([]byte, 1024, 1024)
	for {
		n, err := r.Read(buf[:])
		if n > 0 {
			d := buf[:n]
			out = append(out, d...)
			_, err := w.Write(d)
			if err != nil {
				return out, err
			}
		}
		if err != nil {
			// Read returns io.EOF at the end of file, which is not an error for us
			if err == io.EOF {
				err = nil
			}
			return out, err
		}
	}
}

// extend strings together
func join(strs ...string) string {
	var sb strings.Builder
	for _, str := range strs {
		sb.WriteString(str)
	}
	return sb.String()
}

// wrapper with realtime output for NetworkPolicyAdvisor Inspektor Gadget needs to be deployed on the Kubernetes cluster
func advisorRealTimeWrapper(args ...string) {

	var advisorString = "kubectl gadget network-policy "
	var command string

	// args length control
	if len(args) == 0 {
		command = advisorString
	} else if len(args) == 1 {
		command = join(advisorString, args[0])
	} else {
		var sb strings.Builder
		for _, str := range args {
			sb.WriteString(str)
		}
		command = join(advisorString, sb.String())
	}

	// start advisor and print on console
	cmd := exec.Command("/bin/sh", "-c", command)

	var stdout, stderr []byte
	var errStdout, errStderr error
	stdoutIn, _ := cmd.StdoutPipe()
	stderrIn, _ := cmd.StderrPipe()
	err := cmd.Start()
	if err != nil {
		log.Fatalf("cmd.Start() failed with '%s'\n", err)
	}

	// cmd.Wait() should be called only after we finish reading
	// from stdoutIn and stderrIn.
	// wg ensures that we finish
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		stdout, errStdout = copyAndCapture(os.Stdout, stdoutIn)
		wg.Done()
	}()

	stderr, errStderr = copyAndCapture(os.Stderr, stderrIn)

	wg.Wait()

	err = cmd.Wait()
	if err != nil {
		log.Fatalf("cmd.Run() failed with %s\n", err)
	}
	if errStdout != nil || errStderr != nil {
		log.Fatal("failed to capture stdout or stderr\n")
	}
	outStr, errStr := string(stdout), string(stderr)
	fmt.Printf("\nout:\n%s\nerr:\n%s\n", outStr, errStr)
}

// func startAdvisorMonitor(namespace string, outputfile string) {
// 	if running {
// 		fmt.Print("Allready monitoring")
// 		return
// 	} else {
// 		fmt.Printf("Start Monitoring on '%s' in file '%s' \n", namespace, outputfile)
// 		running = true

// 		var advisorString = "kubectl gadget network-policy monitor --namespace "
// 		var command string

// 		command = join(advisorString, namespace)
// 		command = join(command, " --output ./")
// 		command = join(command, outputfile)

// 		fmt.Printf(command)
// 		fmt.Printf("\n")

// 		cmd := exec.Command("/bin/sh", "-c", command)
// 		cmd.Start()
// 		cmd.Wait()

// 		for {
// 			if running == false {
// 				fmt.Printf("Ich beende \n")
// 				return
// 			} else {
// 				fmt.Print(running)
// 				time.Sleep(time.Second)
// 			}
// 		}
// 	}

// }

func generateReport(inputfile string, outputfile string) {
	var command = "kubectl gadget network-policy report --input ./"

	command = join(command, inputfile)
	command = join(command, " > ")
	command = join(command, outputfile)

	cmdReport := exec.Command("/bin/sh", "-c", command)
	cmdReport.Run()
}

// For Testing pls uncomment the func main()
// it is for bulding commented
/* 
func main() {
 	// go startAdvisorMonitor("demo", "networktrace.log")

 	go advisorRealTimeWrapper("monitor --namespaces demo --output ./networktrace.log")

 	input := bufio.NewScanner(os.Stdin)
 	input.Scan()

 	generateReport("networktrace.log", "network-policy.yaml")
 }
 */