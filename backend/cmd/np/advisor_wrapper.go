package networkPolicy

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"strings"
)

var (
	running bool = false
)

func Report(namespace string) {
	log.Println("####### Sending a Network Policy Report for:", namespace)

	file, err := os.Open("networktrace.log")
	if err != nil {
		log.Println("Error opening networktrace.log: %s", err)
	}

	fileScanner := bufio.NewScanner(file)
	var text []string

	for fileScanner.Scan() {
		text = append(text, fileScanner.Text())
	}

	file.Close()

	i := 0
	for i < len(text)-1 {
		i += 1
		log.Println(text[i])
	}
}

func Start(namespace string) {
	log.Println("####### Starting the Network Policy for:", namespace)
	var command = join("monitor --namespaces ", namespace)
	command = join(command, " --output ./networktrace.log")
	running = true
	go advisorRealTimeWrapper(command)

}

func Stop(namespace string) {
	log.Println("####### Stoping the Network Policy for:", namespace)
	running = false
	generateReport("networktrace.log", "network-policy.yaml")
	os.Remove("networktrace.log")
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

	cmd := exec.Command("/bin/sh", "-c", command)

	var stdout []byte
	var errStdout error
	stdoutIn, _ := cmd.StdoutPipe()

	err := cmd.Start()
	if err != nil {
		log.Fatalf("cmd.Start() failed with '%s'\n", err)
	}

	go func() {
		stdout, errStdout = copyAndCapture(os.Stdout, stdoutIn)
	}()

	for {
		if running != true {

			if err := cmd.Process.Kill(); err != nil {
				fmt.Println("failed to kill process: ", err)
			}
			break
		}
	}
}

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

// func main() {
// 	var namespace = "demo"
// 	var befehl = join("monitor --namespaces ", namespace)
// 	befehl = join(befehl, " --output ./networktrace.log")
// 	fmt.Println(befehl)

// 	running = true
// 	go advisorRealTimeWrapper(befehl)

// 	input := bufio.NewScanner(os.Stdin)
// 	input.Scan()

// 	fmt.Println("wir schließ0en den shit")
// 	// time.Sleep(10 * time.Second)
// 	// fmt.Println("stop running")
// 	running = false

// 	// time.Sleep(2 * time.Second)

// 	fmt.Println("geschlossen")

// 	generateReport("networktrace.log", "network-policy.yaml")
// 	// os.Remove("networktrace.log")
// }
