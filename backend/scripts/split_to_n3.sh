#!/usr/bin/env bash
# Splits large RDF/XML into N-Triples chunks named upload_* (legacy synbiohub split_to_n3.sh).
(>&2 echo "split_to_n3 $@")
rapper -o ntriples "$@" > ntriples.n3 && split -l 5000 ntriples.n3 upload_
