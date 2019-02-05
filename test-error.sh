#!/bin/bash

echo "message in stdout"
(>&2 echo "error message in stderr")
exit 1;