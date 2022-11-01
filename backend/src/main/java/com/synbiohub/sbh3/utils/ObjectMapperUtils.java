package com.synbiohub.sbh3.utils;

import com.synbiohub.sbh3.dto.SubmissionDTO;
import com.synbiohub.sbh3.requests.SubmitRequest;
import org.modelmapper.ModelMapper;
import org.sbolstandard.core2.SBOLDocument;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

public class ObjectMapperUtils {
    private static final ModelMapper modelMapper = new ModelMapper();

    private ObjectMapperUtils(){}

    public static <D, T> D map(final T entity, Class<D> outClass) { return modelMapper.map(entity, outClass); }

    public static <D, T> List<D> mapAll(final Collection<T> entityList, Class<D> outClass) {
        return entityList.stream()
                .map(entity -> map(entity, outClass))
                .collect(Collectors.toList());
    }

    public static <S, D> D map(final S source, D destination) {
        modelMapper.map(source, destination);
        return destination;
    }

//    public static SubmissionDTO createNewSubmission(SubmitRequest request) {
//        return SubmissionDTO.builder()
//                .id(request.getId())
//                .version(Integer.parseInt(request.getVersion()))
//                .name(request.getName())
//                .description(request.getDescription())
//                .citations(Arrays.stream(request.getCitations().split(","))
//                        .map(Integer::parseInt)
//                        .collect(Collectors.toList()))
//                .files(request.getFiles())
//                .build();
//    }

    public static SubmissionDTO createNewSubmission(String name, String description, String id, int version, List<Integer> citations, Collection<File> allFiles, int overwriteMerge, ArrayList<String> plugins, Collection<File> attachmentFiles, SBOLDocument sbolDocument) {
        return SubmissionDTO.builder()
                .id(id)
                .version(version)
                .name(name)
                .description(description)
                .citations(citations)
                .files(allFiles)
                .plugins(plugins)
                .attachments(attachmentFiles)
                .sbolDocument(sbolDocument)
                .build();
    }
}
